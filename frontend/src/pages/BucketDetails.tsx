import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Archive, Plus, Pencil, RotateCcw } from 'lucide-react';
import { PageHeader, MonthSelect } from '../components/layout';
import {
  Button,
  BucketIcon,
  Status,
  Progress,
  Modal,
  Confirm,
  ErrorState,
  Loading,
  useToast,
} from '../components/ui';
import { BucketForm, ExpenseForm } from '../components/forms';
import { TransactionTable } from '../components/finance';
import { useBuckets, useTransactions, useFinanceMutation, send, message } from '../lib/api';
import { useAuth, useMonth } from '../lib/context';
import { money } from '../lib/format';
import type { Transaction } from '../lib/types';

export default function BucketDetails() {
  const { id } = useParams();
  const { month } = useMonth();
  const { user } = useAuth();
  const toast = useToast();
  const buckets = useBuckets(month);
  const [page, setPage] = useState(1);
  const tx = useTransactions({ month, bucketId: id, page, limit: 15 });
  const bucket = buckets.data?.find((b) => b.id === id);
  const [edit, setEdit] = useState(false);
  const [archive, setArchive] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const mutation = useFinanceMutation(() =>
    send(
      bucket?.isArchived ? 'patch' : 'delete',
      `/buckets/${id}`,
      bucket?.isArchived ? { isArchived: false } : undefined,
    ),
  );
  const remove = useFinanceMutation((tid: string) => send('delete', `/transactions/${tid}`));
  useEffect(() => setPage(1), [month, id]);
  if (buckets.isPending) return <Loading />;
  if (buckets.error)
    return (
      <ErrorState
        text={message(buckets.error)}
        retry={() => {
          void buckets.refetch();
        }}
      />
    );
  if (!bucket) return <ErrorState text="This bucket couldn’t be found in your workspace." />;
  return (
    <>
      <Link to="/buckets" className="text-link back-link">
        <ArrowLeft size={15} />
        All buckets
      </Link>
      <PageHeader
        eyebrow="A CLOSER LOOK"
        title={bucket.name}
        description="A little perspective on this part of your life."
      >
        <MonthSelect />
        <Button variant="secondary" onClick={() => setEdit(true)}>
          <Pencil size={15} />
          Edit bucket
        </Button>
        {!bucket.isArchived && (
          <Link className="button button-primary" to={`/add-expense?bucket=${id}`}>
            <Plus size={16} />
            Add expense
          </Link>
        )}
      </PageHeader>
      <section className="panel bucket-detail-summary">
        <div className="bucket-detail-identity">
          <BucketIcon bucket={bucket} size={32} />
          <div>
            <h2>
              {bucket.name}
              {bucket.isArchived && <span className="count-pill">Archived</span>}
            </h2>
            <Status status={bucket.status} />
          </div>
        </div>
        <div className="bucket-detail-numbers">
          <div>
            <small>Monthly budget</small>
            <strong>{money(bucket.budget, user?.currency)}</strong>
          </div>
          <div>
            <small>Spent so far</small>
            <strong>{money(bucket.spent, user?.currency)}</strong>
          </div>
          <div>
            <small>{bucket.remaining < 0 ? 'Over budget' : 'Remaining'}</small>
            <strong>{money(Math.abs(bucket.remaining), user?.currency)}</strong>
          </div>
        </div>
        <div className="detail-progress">
          <span>{bucket.utilization.toFixed(1)}% of monthly budget used</span>
          <Progress value={bucket.utilization} status={bucket.status} color={bucket.color} />
        </div>
      </section>
      <section className="panel section-block">
        <div className="panel-heading">
          <div>
            <h2>Inside this bucket</h2>
            <p>Your transactions for the selected month.</p>
          </div>
        </div>
        {tx.isPending ? (
          <Loading />
        ) : tx.error ? (
          <ErrorState text={message(tx.error)} />
        ) : (
          <TransactionTable
            transactions={tx.data?.items || []}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        )}
        {(tx.data?.pages || 1) > 1 && (
          <div className="table-pagination">
            <Button variant="ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span>
              Page {page} of {tx.data?.pages}
            </span>
            <Button
              variant="ghost"
              disabled={page >= (tx.data?.pages || 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </section>
      <div className="archive-row">
        <p>
          {bucket.isArchived
            ? 'Restore this bucket to start recording expenses again.'
            : 'Need a little less clutter? Archiving keeps all your history safe.'}
        </p>
        <Button variant="ghost" onClick={() => setArchive(true)}>
          {bucket.isArchived ? <RotateCcw size={15} /> : <Archive size={15} />}
          {bucket.isArchived ? 'Restore bucket' : 'Archive bucket'}
        </Button>
      </div>
      <Modal
        open={edit}
        onOpenChange={setEdit}
        title="Refresh your bucket"
        description="Only the selected month’s budget will change."
      >
        {edit && <BucketForm bucket={bucket} onSaved={() => setEdit(false)} />}
      </Modal>
      <Modal
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        title="Edit this expense"
        description="Your bucket totals update automatically."
      >
        {editing && <ExpenseForm transaction={editing} onSaved={() => setEditing(null)} />}
      </Modal>
      <Confirm
        open={archive}
        onClose={() => setArchive(false)}
        title={bucket.isArchived ? 'Restore this bucket?' : 'Tuck this bucket away?'}
        description={
          bucket.isArchived
            ? 'It will become available for new expenses again.'
            : 'Existing transactions and historical budgets will be preserved. New expenses cannot be added until it is restored.'
        }
        busy={mutation.isPending}
        onConfirm={async () => {
          try {
            await mutation.mutateAsync();
            setArchive(false);
            toast(
              bucket.isArchived ? 'Bucket restored.' : 'Bucket archived. Your history is safe.',
            );
          } catch (e) {
            toast(message(e), 'error');
          }
        }}
      />
      <Confirm
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remove this expense?"
        description="This expense will be permanently removed from your notebook."
        busy={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            setDeleting(null);
            toast('Expense removed.');
          } catch (e) {
            toast(message(e), 'error');
          }
        }}
      />
    </>
  );
}
