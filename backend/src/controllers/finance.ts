import type { Request, Response } from 'express';
import { z } from 'zod';
import { BucketBudget } from '../models/index.js';
import * as service from '../services/finance.js';
import {
  idSchema,
  monthSchema,
  createBucketSchema,
  updateBucketSchema,
  budgetSchema,
  budgetPlanSchema,
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
} from '../validators/index.js';
import { ApiError, currentMonth } from '../utils/core.js';
const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });
const id = (req: Request) => idSchema.parse(req.params.id || req.params.bucketId);
const month = (req: Request) =>
  monthSchema.parse(req.query.month || currentMonth(req.account.timezone));
export async function buckets(req: Request, res: Response) {
  const all = await service.bucketViews(req.account, month(req));
  return ok(res, req.query.includeArchived === 'true' ? all : all.filter((b) => !b.isArchived));
}
export async function bucket(req: Request, res: Response) {
  const recordId = id(req);
  await service.ownBucket(req.account._id, recordId);
  const all = await service.bucketViews(req.account, month(req));
  return ok(
    res,
    all.find((b) => b.id === recordId),
  );
}
export async function createBucket(req: Request, res: Response) {
  return ok(res, await service.createBucket(req.account, createBucketSchema.parse(req.body)), 201);
}
export async function updateBucket(req: Request, res: Response) {
  return ok(
    res,
    await service.updateBucket(req.account, id(req), updateBucketSchema.parse(req.body)),
  );
}
export async function archiveBucket(req: Request, res: Response) {
  return ok(res, await service.archiveBucket(req.account, id(req)));
}
export async function budgets(req: Request, res: Response) {
  const records = await BucketBudget.find({ userId: req.account._id, monthKey: month(req) }).lean();
  return ok(
    res,
    records.map((b) => ({
      id: String(b._id),
      bucketId: String(b.bucketId),
      monthKey: b.monthKey,
      amount: b.amount,
    })),
  );
}
export async function budget(req: Request, res: Response) {
  const bucketId = id(req);
  const monthKey = month(req);
  await service.ownBucket(req.account._id, bucketId);
  const b = await BucketBudget.findOne({ userId: req.account._id, bucketId, monthKey }).lean();
  return ok(res, { bucketId, monthKey, amount: b?.amount || 0 });
}
export async function setBudget(req: Request, res: Response) {
  const values = budgetSchema.parse(req.body);
  return ok(res, await service.setBudget(req.account, id(req), values.monthKey, values.amount));
}
export async function saveBudgetPlan(req: Request, res: Response) {
  const values = budgetPlanSchema.parse(req.body);
  return ok(res, await service.saveBudgetPlan(req.account, values.monthKey, values.items));
}
export async function transactions(req: Request, res: Response) {
  return ok(
    res,
    await service.listTransactions(req.account, transactionQuerySchema.parse(req.query)),
  );
}
export async function transaction(req: Request, res: Response) {
  return ok(
    res,
    await service.transactionDTO(
      await service.ownTransaction(req.account, id(req)),
      req.account.timezone,
    ),
  );
}
export async function createTransaction(req: Request, res: Response) {
  return ok(
    res,
    await service.createTransaction(req.account, createTransactionSchema.parse(req.body)),
    201,
  );
}
export async function updateTransaction(req: Request, res: Response) {
  return ok(
    res,
    await service.updateTransaction(req.account, id(req), updateTransactionSchema.parse(req.body)),
  );
}
export async function deleteTransaction(req: Request, res: Response) {
  const tx = await service.ownTransaction(req.account, id(req));
  await tx.deleteOne();
  return ok(res, { id: String(tx._id) });
}
export async function overview(req: Request, res: Response) {
  return ok(res, await service.overview(req.account, month(req)));
}
export async function summary(req: Request, res: Response) {
  const {
    buckets: _b,
    trend: _t,
    daily: _d,
    recent: _r,
    ...data
  } = await service.overview(req.account, month(req));
  return ok(res, data);
}
export async function breakdown(req: Request, res: Response) {
  return ok(res, await service.bucketViews(req.account, month(req)));
}
export async function trends(req: Request, res: Response) {
  return ok(res, await service.monthlyTrends(req.account, month(req)));
}
export async function recent(req: Request, res: Response) {
  const result = await service.listTransactions(req.account, {
    month: month(req),
    sort: 'date-desc',
    limit: 5,
    page: 1,
  });
  return ok(res, result.items);
}
export async function annual(req: Request, res: Response) {
  const year = z.coerce
    .number()
    .int()
    .min(2000)
    .max(2100)
    .parse(req.query.year || currentMonth(req.account.timezone).slice(0, 4));
  const months = await service.monthlyTrends(req.account, `${year}-12`, 12);
  return ok(res, {
    year,
    months,
    budget: months.reduce((s, m) => s + m.budget, 0),
    spent: months.reduce((s, m) => s + m.spent, 0),
  });
}
