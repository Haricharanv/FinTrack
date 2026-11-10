import { useState } from 'react';
import { addMonths, format, parseISO } from 'date-fns';
import { ArrowRight, Check, Copy, SlidersHorizontal } from 'lucide-react';
import { useAuth, useMonth } from '../lib/context';
import { get, send, message, useFinanceMutation } from '../lib/api';
import { money, monthTitle } from '../lib/format';
import type { Bucket } from '../lib/types';
import { BucketIcon, Button, FormError, Modal, useToast } from './ui';

export function BudgetPlanner({ buckets, onClose }: { buckets: Bucket[]; onClose: () => void }) {
  const { month } = useMonth();
  const { user } = useAuth();
  const toast = useToast();
  const active = buckets.filter((bucket) => !bucket.isArchived);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(active.map((bucket) => [bucket.id, String(bucket.budget / 100)])),
  );
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const save = useFinanceMutation((items: { bucketId: string; amount: number }[]) =>
    send('put', '/budgets', { monthKey: month, items }),
  );
  const previous = format(addMonths(parseISO(`${month}-01`), -1), 'yyyy-MM');
  const total = active.reduce(
    (sum, bucket) => sum + Math.round((Number(values[bucket.id]) || 0) * 100),
    0,
  );
  const copyPrevious = async () => {
    setCopying(true);
    setError('');
    try {
      const plans = await get<{ bucketId: string; amount: number }[]>('/budgets', {
        month: previous,
      });
      const byBucket = new Map(plans.map((plan) => [plan.bucketId, plan.amount]));
      if (!active.some((bucket) => byBucket.has(bucket.id))) {
        setError(`No active bucket budgets were found for ${monthTitle(previous)}.`);
        return;
      }
      setValues((current) =>
        Object.fromEntries(
          active.map((bucket) => [
            bucket.id,
            byBucket.has(bucket.id) ? String(byBucket.get(bucket.id)! / 100) : current[bucket.id],
          ]),
        ),
      );
      setCopied(true);
    } catch (e) {
      setError(message(e));
    } finally {
      setCopying(false);
    }
  };
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open && !save.isPending) onClose();
      }}
      title="Make a little room for everything."
      description={`Set your spending plan for ${monthTitle(month)}. Other months keep their own budgets.`}
      wide
    >
      <form
        className="budget-planner"
        onSubmit={async (event) => {
          event.preventDefault();
          if (save.isPending) return;
          setError('');
          const invalid = active.find(
            (bucket) =>
              !/^\d+(\.\d{1,2})?$/.test(values[bucket.id] || '') ||
              Number(values[bucket.id]) > 10_000_000,
          );
          if (invalid) {
            setError(
              `Enter a valid budget for ${invalid.name}, from 0 to 10,000,000 with up to two decimal places.`,
            );
            return;
          }
          try {
            await save.mutateAsync(
              active.map((bucket) => ({
                bucketId: bucket.id,
                amount: Math.round(Number(values[bucket.id]) * 100),
              })),
            );
            toast(`${monthTitle(month)} is planned. A little clarity, all in one place.`);
            onClose();
          } catch (e) {
            setError(message(e));
          }
        }}
      >
        <div className="planner-total">
          <span>
            <SlidersHorizontal size={18} /> YOUR MONTHLY PLAN
          </span>
          <strong>{money(total, user?.currency)}</strong>
          <small>Across {active.length} active buckets</small>
        </div>
        <div className="planner-copy">
          <Button
            type="button"
            variant="secondary"
            onClick={copyPrevious}
            busy={copying}
            disabled={save.isPending || previous < '2000-01'}
          >
            <Copy size={15} />
            Use last month’s plan
          </Button>
          <span>
            {copied
              ? 'Copied into your draft. Review, then save.'
              : 'A familiar starting point, ready to adjust.'}
          </span>
        </div>
        <div className="planner-rows">
          {active.map((bucket) => (
            <label className="planner-row" key={bucket.id}>
              <span className="planner-bucket">
                <BucketIcon bucket={bucket} size={18} />
                <span>
                  <strong>{bucket.name}</strong>
                  <small>{money(bucket.spent, user?.currency)} spent this month</small>
                </span>
              </span>
              <span className="planner-input">
                <span>{user?.currency}</span>
                <input
                  aria-label={`${bucket.name} budget`}
                  inputMode="decimal"
                  value={values[bucket.id]}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [bucket.id]: event.target.value }))
                  }
                  disabled={save.isPending}
                  required
                />
              </span>
            </label>
          ))}
        </div>
        <FormError>{error}</FormError>
        <div className="planner-footer">
          <span>
            <Check size={14} />
            Your history stays yours.
          </span>
          <Button type="submit" busy={save.isPending} disabled={copying || !active.length}>
            Save monthly plan <ArrowRight size={16} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
