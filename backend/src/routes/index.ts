import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/security.js';
import * as auth from '../controllers/auth.js';
import * as finance from '../controllers/finance.js';
import { env } from '../config/env.js';

export const api = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: env.production ? 20 : 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many sign-in attempts. Please try again in 15 minutes.',
    },
  },
});
const demoLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Please wait before creating another demo workspace.' },
  },
});
api.get('/auth/config', auth.config);
api.post('/auth/register', authLimiter, auth.register);
api.post('/auth/login', authLimiter, auth.signIn);
api.post('/auth/demo', demoLimiter, auth.demo);
api.use(authenticate);
api.get('/auth/me', auth.me);
api.post('/auth/logout', auth.signOut);
api.patch('/auth/profile', auth.profile);
api.patch('/auth/change-password', authLimiter, auth.password);
api.get('/buckets', finance.buckets);
api.post('/buckets', finance.createBucket);
api.get('/buckets/:id', finance.bucket);
api.patch('/buckets/:id', finance.updateBucket);
api.delete('/buckets/:id', finance.archiveBucket);
api.get('/budgets', finance.budgets);
api.put('/budgets', finance.saveBudgetPlan);
api.get('/budgets/:bucketId', finance.budget);
api.put('/budgets/:bucketId', finance.setBudget);
api.get('/transactions', finance.transactions);
api.post('/transactions', finance.createTransaction);
api.get('/transactions/:id', finance.transaction);
api.patch('/transactions/:id', finance.updateTransaction);
api.delete('/transactions/:id', finance.deleteTransaction);
api.get('/dashboard/overview', finance.overview);
api.get('/dashboard/summary', finance.summary);
api.get('/dashboard/bucket-breakdown', finance.breakdown);
api.get('/dashboard/monthly-trends', finance.trends);
api.get('/dashboard/recent-transactions', finance.recent);
api.get('/reports/monthly', finance.overview);
api.get('/reports/annual', finance.annual);
