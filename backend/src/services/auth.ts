import bcrypt from 'bcrypt';
import { User, Bucket, BucketBudget, Transaction, type UserDocument } from '../models/index.js';
import { ApiError } from '../utils/core.js';
import type { z } from 'zod';
import type { registerSchema } from '../validators/index.js';
export const defaultBuckets = [
  { name: 'Food', icon: 'utensils', color: '#7d985e' },
  { name: 'Travel', icon: 'plane', color: '#c59b60' },
  { name: 'Shopping', icon: 'shopping', color: '#9690b7' },
  { name: 'Rent', icon: 'home', color: '#4d7665' },
  { name: 'Bills & Utilities', icon: 'zap', color: '#7c9da8' },
  { name: 'Education', icon: 'education', color: '#a38f6e' },
  { name: 'Health', icon: 'health', color: '#b87d7b' },
  { name: 'Entertainment', icon: 'entertainment', color: '#a385ac' },
  { name: 'Personal Care', icon: 'care', color: '#a5a072' },
  { name: 'Subscriptions', icon: 'subscriptions', color: '#8c9eb5' },
  { name: 'Other', icon: 'other', color: '#9b9b87' },
];
export function userDTO(user: UserDocument) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    currency: user.currency,
    timezone: user.timezone,
    isDemo: user.isDemo,
  };
}
export async function registerAccount(input: z.infer<typeof registerSchema>, isDemo = false) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    timezone: input.timezone,
    isDemo,
  });
  try {
    await Bucket.insertMany(
      defaultBuckets.map((b, i) => ({
        ...b,
        nameKey: b.name.toLowerCase(),
        userId: user._id,
        isDefault: true,
        isArchived: false,
        sortOrder: i,
      })),
    );
  } catch (error) {
    await Bucket.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    throw error;
  }
  return user;
}
// A fixed-cost comparison is also performed for unknown emails to reduce timing differences.
const dummyHash = await bcrypt.hash('not-an-account-password-35e6c7', 12);
export async function login(email: string, password: string) {
  const user = await User.findOne({ email }).select('+passwordHash +sessionVersion');
  const matches = await bcrypt.compare(password, user?.passwordHash || dummyHash);
  if (!user || !matches)
    throw new ApiError(401, 'That email and password don’t match.', 'INVALID_CREDENTIALS');
  return user;
}
export async function changePassword(
  user: UserDocument,
  currentPassword: string,
  newPassword: string,
) {
  const stored = await User.findById(user._id).select('+passwordHash +sessionVersion');
  if (!stored || !(await bcrypt.compare(currentPassword, stored.passwordHash)))
    throw new ApiError(400, 'Your current password isn’t correct.');
  stored.passwordHash = await bcrypt.hash(newPassword, 12);
  stored.sessionVersion += 1;
  await stored.save();
  return stored;
}
