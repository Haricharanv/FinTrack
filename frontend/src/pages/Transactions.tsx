import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PageHeader, MonthSelect } from '../components/layout';
import { TransactionTable } from '../components/finance';
import { ExpenseForm } from '../components/forms';
import { Button, Modal, Confirm, Loading, ErrorState, useToast } from '../components/ui';
import { useTransactions, useBuckets, useFinanceMutation, send, message } from '../lib/api';
import { useMonth } from '../lib/context';
import type { Transaction } from '../lib/types';

export default function Transactions() {
  const { month } = useMonth();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [debounced, setDebounced] = useState(search);
  const [bucketId, setBucketId] = useState('');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [range, setRange] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const toast = useToast();
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(id);
  }, [search]);
  useEffect(() => setSearch(params.get('search') || ''), [params]);
  useEffect(() => setPage(1), [month, bucketId, sort, from, to]);
  const { data: buckets } = useBuckets(month);
  const query = useTransactions({
    month,
    search: debounced,
    bucketId: bucketId || undefined,
    sort,
    page,
    limit: 12,
    from: from || undefined,
    to: to || undefined,
  });
  const remove = useFinanceMutation((id: string) => send('delete', `/transactions/${id}`));
  return (
    <>
      <PageHeader
        title="Your everyday, accounted for."
        description="Every coffee, every commute, every little thing."
      >
        <MonthSelect />
        <Link className="button button-primary" to="/add-expense">
          <Plus size={17} />
          Add expense
        </Link>
      </PageHeader>
      <section className="panel transactions-panel">
        <div className="transaction-toolbar">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Search descriptions"
              placeholder="Search your notebook…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="filter-controls">
            <select
              aria-label="Filter by bucket"
              value={bucketId}
              onChange={(e) => setBucketId(e.target.value)}
            >
              <option value="">All buckets</option>
              {buckets?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.isArchived ? ' (archived)' : ''}
                </option>
              ))}
            </select>
            <select
              aria-label="Sort transactions"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="amount-desc">Highest amount</option>
              <option value="amount-asc">Lowest amount</option>
            </select>
            <button
              className={`icon-button ${range ? 'selected' : ''}`}
              aria-label="Date range filters"
              aria-expanded={range}
              onClick={() => setRange((v) => !v)}
            >
              <SlidersHorizontal size={17} />
            </button>
          </div>
        </div>
        {range && (
          <div className="date-filter-row">
            <label className="field">
              From
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="field">
              To
              <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
            </label>
            <Button
              variant="ghost"
              onClick={() => {
                setFrom('');
                setTo('');
              }}
            >
              <X size={14} />
              Clear range
            </Button>
            <small>Within the selected month</small>
          </div>
        )}
        {query.isPending ? (
          <Loading />
        ) : query.error ? (
          <ErrorState
            text={message(query.error)}
            retry={() => {
              void query.refetch();
            }}
          />
        ) : (
          <>
            <TransactionTable
              transactions={query.data?.items || []}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
            <div className="table-pagination">
              <span>
                {query.data?.total || 0} transactions{' '}
                <span className="pagination-muted">
                  · Page {page} of {query.data?.pages || 1}
                </span>
              </span>
              <div>
                <button
                  className="icon-button"
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Next page"
                  disabled={page >= (query.data?.pages || 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      <Modal
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        title="Edit this expense"
        description="Make a correction. Your totals will update everywhere."
      >
        {editing && (
          <ExpenseForm key={editing.id} transaction={editing} onSaved={() => setEditing(null)} />
        )}
      </Modal>
      <Confirm
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remove this expense?"
        description={`“${deleting?.description || ''}” will be permanently removed and your spending totals will be recalculated.`}
        busy={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            setDeleting(null);
            toast('Expense removed. Your totals are up to date.');
          } catch (e) {
            toast(message(e), 'error');
          }
        }}
      />
    </>
  );
}
