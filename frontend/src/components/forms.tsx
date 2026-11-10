import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, Plus, ShieldCheck } from 'lucide-react';
import { useAuth, useMonth } from '../lib/context';
import { useBuckets, useFinanceMutation, send, message } from '../lib/api';
import { today, money, monthTitle } from '../lib/format';
import { Button, FormError, bucketIcons, useToast } from './ui';
import type { Bucket, Transaction } from '../lib/types';

const decimal = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Use an amount with at most 2 decimal places.')
  .refine(
    (s) => Number(s) > 0 && Number(s) <= 10000000,
    'Enter an amount between 0.01 and 10,000,000.',
  );
const expenseSchema = z.object({
  description: z.string().trim().min(2, 'A short description helps you remember.').max(160),
  amount: decimal,
  bucketId: z.string().min(1, 'Choose a bucket for this expense.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date.'),
  notes: z.string().max(1000).optional(),
});
type ExpenseFields = z.infer<typeof expenseSchema>;
export function ExpenseForm({
  transaction,
  onSaved,
  initialBucketId,
}: {
  transaction?: Transaction;
  onSaved?: () => void;
  initialBucketId?: string;
}) {
  const { user } = useAuth();
  const notify = useToast();
  const requestId = useRef(crypto.randomUUID());
  const defaults = {
    description: transaction?.description || '',
    amount: transaction ? String(transaction.amount / 100) : '',
    bucketId: transaction?.bucket.id || initialBucketId || '',
    date: transaction?.dateKey || today(user?.timezone),
    notes: transaction?.notes || '',
  };
  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFields>({ resolver: zodResolver(expenseSchema), defaultValues: defaults });
  const date = watch('date');
  const { data: buckets } = useBuckets(date?.slice(0, 7) || today(user?.timezone).slice(0, 7));
  const bucket = buckets?.find((b) => b.id === watch('bucketId'));
  const mutation = useFinanceMutation((values: ExpenseFields) =>
    send(
      transaction ? 'patch' : 'post',
      transaction ? `/transactions/${transaction.id}` : '/transactions',
      {
        ...values,
        amount: Math.round(Number(values.amount) * 100),
        ...(transaction ? {} : { requestId: requestId.current }),
      },
    ),
  );
  const save = async (values: ExpenseFields) => {
    if (mutation.isPending) return;
    try {
      await mutation.mutateAsync(values);
      notify(
        transaction
          ? 'Expense updated. Everything is in sync.'
          : 'Expense recorded. A little more clarity.',
      );
      requestId.current = crypto.randomUUID();
      if (!transaction) reset({ ...defaults, bucketId: values.bucketId, date: values.date });
      onSaved?.();
    } catch {
      /* The mutation error is displayed below. */
    }
  };
  return (
    <form onSubmit={handleSubmit(save)} className="expense-form" noValidate>
      <label className="field">
        What did you spend on?
        <input
          {...register('description')}
          placeholder="A coffee, a cab, something you love…"
          autoFocus
          maxLength={160}
          aria-invalid={!!errors.description}
        />
        <FormError>{errors.description?.message}</FormError>
      </label>
      <div className="form-grid">
        <label className="field">
          Amount{' '}
          <span className="input-affix">
            <span>{user?.currency === 'INR' ? '₹' : user?.currency}</span>
            <input
              {...register('amount')}
              inputMode="decimal"
              placeholder="0.00"
              aria-invalid={!!errors.amount}
            />
          </span>
          <FormError>{errors.amount?.message}</FormError>
        </label>
        <label className="field">
          Date
          <input
            {...register('date')}
            type="date"
            min="2000-01-01"
            max={today(user?.timezone)}
            aria-invalid={!!errors.date}
          />
          <FormError>{errors.date?.message}</FormError>
        </label>
      </div>
      <label className="field">
        Choose a bucket
        <select {...register('bucketId')} aria-invalid={!!errors.bucketId}>
          <option value="">Where does it belong?</option>
          {buckets
            ?.filter((b) => !b.isArchived || b.id === transaction?.bucket.id)
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.isArchived ? ' (archived)' : ''}
              </option>
            ))}
        </select>
        <FormError>{errors.bucketId?.message}</FormError>
      </label>
      {bucket && (
        <div className="selected-budget">
          <span>{bucket.name} budget remaining</span>
          <strong>{money(bucket.remaining, user?.currency)}</strong>
        </div>
      )}
      <label className="field">
        A little extra context <span className="optional">optional</span>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Anything you’d like to remember"
          maxLength={1000}
        />
      </label>
      <FormError>{mutation.error && message(mutation.error)}</FormError>
      <Button type="submit" busy={mutation.isPending} className="full-width">
        {transaction ? <Check size={18} /> : <Plus size={18} />}
        {transaction ? 'Save changes' : 'Add expense'}
        <ArrowRight size={17} className="push-right" />
      </Button>
      <p className="form-footnote">
        <ShieldCheck size={14} />
        Saved securely. Only visible to you.
      </p>
    </form>
  );
}
const bucketSchema = z.object({
  name: z.string().trim().min(2, 'Give your bucket a name.').max(40),
  icon: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  budget: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a non-negative amount.')
    .refine((s) => Number(s) <= 10000000, 'Maximum budget is 10,000,000.'),
});
type BucketFields = z.infer<typeof bucketSchema>;
const colors = [
  '#5a8054',
  '#c39050',
  '#7e79af',
  '#5e9b95',
  '#bf7772',
  '#6b89a9',
  '#b98baf',
  '#869265',
];
export function BucketForm({ bucket, onSaved }: { bucket?: Bucket; onSaved: () => void }) {
  const { month } = useMonth();
  const notify = useToast();
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<BucketFields>({
    resolver: zodResolver(bucketSchema),
    defaultValues: {
      name: bucket?.name || '',
      icon: bucket?.icon || 'wallet',
      color: bucket?.color || colors[0],
      budget: String((bucket?.budget || 0) / 100),
    },
  });
  const mutation = useFinanceMutation((values: BucketFields) =>
    send(bucket ? 'patch' : 'post', bucket ? `/buckets/${bucket.id}` : '/buckets', {
      name: values.name,
      icon: values.icon,
      color: values.color,
      monthKey: month,
      budget: Math.round(Number(values.budget) * 100),
    }),
  );
  return (
    <form
      className="stack"
      onSubmit={handleSubmit(async (values) => {
        try {
          await mutation.mutateAsync(values);
          notify(bucket ? 'Bucket and monthly budget updated.' : 'A new bucket, a new intention.');
          onSaved();
        } catch {
          /* Inline error. */
        }
      })}
    >
      <label className="field">
        Bucket name
        <input {...register('name')} placeholder="e.g. Weekend adventures" maxLength={40} />
        <FormError>{errors.name?.message}</FormError>
      </label>
      <fieldset className="choice-field">
        <legend>Choose an icon</legend>
        <div className="icon-options">
          {Object.entries(bucketIcons).map(([key, Icon]) => (
            <button
              type="button"
              key={key}
              aria-label={key}
              aria-pressed={watch('icon') === key}
              className={watch('icon') === key ? 'selected' : ''}
              onClick={() => setValue('icon', key)}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="choice-field">
        <legend>Make it yours</legend>
        <div className="color-options">
          {colors.map((color) => (
            <button
              type="button"
              key={color}
              aria-label={`Color ${color}`}
              aria-pressed={watch('color') === color}
              style={{ background: color }}
              onClick={() => setValue('color', color)}
            >
              {watch('color') === color && <Check size={18} />}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="field">
        Budget for {monthTitle(month)}
        <input {...register('budget')} inputMode="decimal" placeholder="0.00" />
        <small>Only this month’s budget changes. Your history stays intact.</small>
        <FormError>{errors.budget?.message}</FormError>
      </label>
      <FormError>{mutation.error && message(mutation.error)}</FormError>
      <Button type="submit" busy={mutation.isPending}>
        {bucket ? 'Save changes' : 'Create bucket'}
        <ArrowRight size={17} />
      </Button>
    </form>
  );
}
