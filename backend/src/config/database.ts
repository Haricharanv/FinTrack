import mongoose from 'mongoose';
import { env } from './env.js';
import { User, Bucket, BucketBudget, Transaction } from '../models/index.js';
export async function connectDatabase(uri = env.mongodb) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  await Promise.all([User.init(), Bucket.init(), BucketBudget.init(), Transaction.init()]);
}
