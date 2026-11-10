import { z } from 'zod';
import { validCalendarDate } from '../utils/core.js';
export const idSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid record ID.');
export const monthSchema = z
  .string()
  .regex(/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/, 'Use a month in YYYY-MM format.');
const timezone = z
  .string()
  .max(80)
  .refine((v) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }, 'Choose a valid IANA timezone.');
const password = z
  .string()
  .min(10, 'Use at least 10 characters for your password.')
  .max(72, 'Use at most 72 characters.')
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes.');
export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.email().toLowerCase().max(254),
    password,
    timezone: timezone.default('Asia/Kolkata'),
  })
  .strict();
export const loginSchema = z
  .object({
    email: z.email().toLowerCase().max(254),
    password: z.string().min(1).max(256),
    name: z.string().optional(),
    timezone: z.string().optional(),
  })
  .strict();
export const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).optional(),
    timezone: timezone.optional(),
  })
  .strict();
export const passwordSchema = z
  .object({ currentPassword: z.string().min(1).max(256), newPassword: password })
  .strict();
export const amountSchema = z.number().int().min(0).max(1_000_000_000);
const bucketFields = {
  name: z.string().trim().min(2).max(40),
  icon: z.enum([
    'utensils',
    'plane',
    'shopping',
    'home',
    'zap',
    'education',
    'health',
    'entertainment',
    'care',
    'subscriptions',
    'other',
    'coffee',
    'car',
    'gift',
    'wallet',
    'bank',
  ]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  monthKey: monthSchema,
  budget: amountSchema,
};
export const createBucketSchema = z.object(bucketFields).strict();
export const updateBucketSchema = z
  .object({
    name: bucketFields.name.optional(),
    icon: bucketFields.icon.optional(),
    color: bucketFields.color.optional(),
    monthKey: monthSchema.optional(),
    budget: amountSchema.optional(),
    isArchived: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) => v.budget === undefined || !!v.monthKey,
    'A month is required when changing a budget.',
  );
export const budgetSchema = z.object({ monthKey: monthSchema, amount: amountSchema }).strict();
export const budgetPlanSchema = z
  .object({
    monthKey: monthSchema,
    items: z
      .array(z.object({ bucketId: idSchema, amount: amountSchema }).strict())
      .min(1)
      .max(200),
  })
  .strict()
  .refine(
    (plan) =>
      new Set(plan.items.map((item) => item.bucketId.toLowerCase())).size === plan.items.length,
    'Each bucket may appear only once in a spending plan.',
  );
const dateSchema = z
  .string()
  .refine(validCalendarDate, 'Choose a valid calendar date.')
  .refine((v) => v >= '2000-01-01' && v <= '2100-12-31', 'Date must be between 2000 and 2100.');
const expenseFields = {
  description: z.string().trim().min(2).max(160),
  amount: amountSchema.refine((n) => n > 0, 'Amount must be greater than zero.'),
  bucketId: idSchema,
  date: dateSchema,
  notes: z.string().trim().max(1000).default(''),
};
export const createTransactionSchema = z
  .object({ ...expenseFields, requestId: z.uuid().optional() })
  .strict();
export const updateTransactionSchema = z.object(expenseFields).partial().strict();
export const transactionQuerySchema = z
  .object({
    month: monthSchema.optional(),
    bucketId: idSchema.optional(),
    search: z.string().max(100).optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    sort: z.enum(['date-desc', 'date-asc', 'amount-desc', 'amount-asc']).default('date-desc'),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
  })
  .strict()
  .refine((q) => !q.from || !q.to || q.from <= q.to, 'Start date must be before end date.');
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
export type CreateBucket = z.infer<typeof createBucketSchema>;
export type UpdateBucket = z.infer<typeof updateBucketSchema>;
