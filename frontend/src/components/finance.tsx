import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  CreditCard,
  Coins,
  Gauge,
  ChevronRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import { BucketIcon, Progress, Status, Empty } from './ui';
import { money, dateTitle } from '../lib/format';
import { useAuth } from '../lib/context';
import type { Bucket, Overview, Transaction } from '../lib/types';
import { MagicTiltCard } from './MagicTiltCard';

export function SummaryCards({ data }: { data: Overview }) {
  const { user } = useAuth();
  const cards = [
    {
      label: 'Monthly budget',
      value: money(data.budget, user?.currency),
      icon: Wallet,
      detail: `${data.buckets.filter((b) => b.budget > 0).length} buckets planned`,
      kind: 'neutral',
    },
    {
      label: 'Spent so far',
      value: money(data.spent, user?.currency),
      icon: CreditCard,
      detail: `${data.transactionCount} recorded expenses`,
      kind: 'neutral',
    },
    {
      label: 'Left to spend',
      value: money(data.remaining, user?.currency),
      icon: Coins,
      detail: data.remaining < 0 ? 'Time for a budget check-in' : 'A little breathing room',
      kind: data.remaining < 0 ? 'danger' : 'positive',
    },
    {
      label: 'Budget used',
      value: `${data.utilization.toFixed(1)}%`,
      icon: Gauge,
      detail:
        data.budget > 0
          ? `${Math.max(0, 100 - data.utilization).toFixed(1)}% of your plan left`
          : 'Set a budget to get started',
      kind: 'neutral',
    },
  ];
  return (
    <div className="summary-grid">
      {cards.map(({ label, value, icon: Icon, detail, kind }) => (
        <MagicTiltCard className={`summary-card ${kind}`} key={label} maxTilt={2}>
          <div className="summary-top">
            <span>{label}</span>
            <span className="summary-icon">
              <Icon size={17} strokeWidth={1.6} />
            </span>
          </div>
          <strong className="summary-value">{value}</strong>
          <div className="summary-bottom">
            {kind === 'positive' ? <ArrowUpRight size={13} /> : <span className="tiny-dot" />}
            <span>{detail}</span>
          </div>
        </MagicTiltCard>
      ))}
    </div>
  );
}
export function BucketCard({ bucket, onEdit }: { bucket: Bucket; onEdit?: (b: Bucket) => void }) {
  const { user } = useAuth();
  return (
    <article className={`bucket-card ${bucket.isArchived ? 'archived' : ''}`}>
      <div className="bucket-card-top">
        <BucketIcon bucket={bucket} />
        <Link to={`/buckets/${bucket.id}`} className="bucket-card-name">
          <h3>{bucket.name}</h3>
          <small>{bucket.isArchived ? 'Archived bucket' : 'Monthly spending'}</small>
        </Link>
        {onEdit ? (
          <button
            className="icon-button"
            aria-label={`Edit ${bucket.name}`}
            onClick={() => onEdit(bucket)}
          >
            <Pencil size={15} />
          </button>
        ) : (
          <Link
            to={`/buckets/${bucket.id}`}
            className="icon-button"
            aria-label={`View ${bucket.name}`}
          >
            <ArrowUpRight size={17} />
          </Link>
        )}
      </div>
      <div className="bucket-amount">
        <strong>{money(bucket.spent, user?.currency)}</strong>
        <span>of {money(bucket.budget, user?.currency)}</span>
      </div>
      <Progress value={bucket.utilization} status={bucket.status} color={bucket.color} />
      <div className="bucket-card-bottom">
        <span>
          {money(Math.abs(bucket.remaining), user?.currency)}{' '}
          {bucket.remaining < 0 ? 'over budget' : 'left'}
        </span>
        <Status status={bucket.status} />
      </div>
    </article>
  );
}
export function TransactionTable({
  transactions,
  onEdit,
  onDelete,
  compact = false,
}: {
  transactions: Transaction[];
  onEdit?: (t: Transaction) => void;
  onDelete?: (t: Transaction) => void;
  compact?: boolean;
}) {
  const { user } = useAuth();
  if (!transactions.length)
    return (
      <Empty title="Your notebook is ready">
        No expenses here yet. Add your first one and start finding your rhythm.
      </Empty>
    );
  return (
    <div className="table-scroll">
      <table className={`transaction-table ${compact ? 'compact' : ''}`}>
        <thead>
          <tr>
            <th>Description</th>
            <th>Bucket</th>
            <th>Date</th>
            {!compact && <th>Recorded</th>}
            <th className="amount-cell">Amount</th>
            {onEdit && (
              <th>
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td>
                <div className="transaction-description">
                  <BucketIcon bucket={t.bucket} size={17} />
                  <span>
                    <strong>{t.description}</strong>
                    {!compact && t.notes && <small>{t.notes}</small>}
                  </span>
                </div>
              </td>
              <td>
                <Link to={`/buckets/${t.bucket.id}`} className="category-pill">
                  <i style={{ background: t.bucket.color }} />
                  {t.bucket.name}
                  {t.bucket.isArchived && ' · Archived'}
                </Link>
              </td>
              <td className="muted nowrap">{dateTitle(t.dateKey)}</td>
              {!compact && <td className="muted nowrap">{dateTitle(t.createdAt)}</td>}
              <td className="amount-cell">−{money(t.amount, user?.currency)}</td>
              {onEdit && (
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`Edit ${t.description}`}
                      onClick={() => onEdit(t)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button delete-action"
                      aria-label={`Delete ${t.description}`}
                      onClick={() => onDelete?.(t)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
