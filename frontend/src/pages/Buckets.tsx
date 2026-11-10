import { useState } from 'react';
import { Plus, Search, Archive, SlidersHorizontal } from 'lucide-react';
import { BudgetPlanner } from '../components/BudgetPlanner';
import { PageHeader, MonthSelect } from '../components/layout';
import { BucketCard } from '../components/finance';
import { BucketForm } from '../components/forms';
import { Button, Modal, Empty, Loading, ErrorState } from '../components/ui';
import { useBuckets, message } from '../lib/api';
import { useMonth } from '../lib/context';
import type { Bucket } from '../lib/types';

export default function Buckets() {
  const { month } = useMonth();
  const { data, isPending, error, refetch } = useBuckets(month);
  const [editing, setEditing] = useState<Bucket | undefined>();
  const [open, setOpen] = useState(false);
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [planning, setPlanning] = useState(false);
  const filtered = data?.filter(
    (b) => b.isArchived === archived && b.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="A place for every possibility."
        description="Organize your everyday. Make space for the things you love."
      >
        <MonthSelect />
        <Button
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          <Plus size={17} />
          New bucket
        </Button>
      </PageHeader>
      {!!data?.some((bucket) => !bucket.isArchived) && (
        <div className="plan-callout">
          <div>
            <span className="plan-callout-icon">
              <SlidersHorizontal size={22} />
            </span>
            <span>
              <h2>A little planning goes a long way.</h2>
              <p>Give every bucket a limit, all in one place.</p>
            </span>
          </div>
          <Button variant="secondary" onClick={() => setPlanning(true)}>
            Plan this month <SlidersHorizontal size={16} />
          </Button>
        </div>
      )}
      <div className="list-toolbar">
        <div className="segmented">
          <button className={!archived ? 'selected' : ''} onClick={() => setArchived(false)}>
            Active buckets <span>{data?.filter((b) => !b.isArchived).length || 0}</span>
          </button>
          <button className={archived ? 'selected' : ''} onClick={() => setArchived(true)}>
            <Archive size={14} />
            Archived
          </button>
        </div>
        <label className="search-field">
          <Search size={16} />
          <input
            aria-label="Search buckets"
            placeholder="Find a bucket…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState
          text={message(error)}
          retry={() => {
            void refetch();
          }}
        />
      ) : filtered?.length ? (
        <div className="bucket-grid all-buckets">
          {filtered.map((b) => (
            <BucketCard
              key={b.id}
              bucket={b}
              onEdit={(b) => {
                setEditing(b);
                setOpen(true);
              }}
            />
          ))}
          {!archived && !search && (
            <button
              className="new-bucket-card"
              onClick={() => {
                setEditing(undefined);
                setOpen(true);
              }}
            >
              <span>
                <Plus size={24} />
              </span>
              <strong>A new intention</strong>
              <small>Create a bucket for what’s next</small>
            </button>
          )}
        </div>
      ) : (
        <div className="panel">
          <Empty title={archived ? 'Nothing tucked away yet' : 'No matching buckets'}>
            {archived
              ? 'Archived buckets will live here. Their history is always preserved.'
              : 'Try another name, or create a new bucket.'}
          </Empty>
        </div>
      )}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'A little bucket refresh' : 'Give it a home'}
        description={
          editing
            ? 'Update the details and this month’s spending plan.'
            : 'Create a bucket for something that matters to you.'
        }
      >
        {open && (
          <BucketForm key={editing?.id || 'new'} bucket={editing} onSaved={() => setOpen(false)} />
        )}
      </Modal>
      {planning && data && (
        <BudgetPlanner key={month} buckets={data} onClose={() => setPlanning(false)} />
      )}
    </>
  );
}
