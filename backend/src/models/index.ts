import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from 'mongoose';
const objectId = Schema.Types.ObjectId;
const minorAmount = {
  type: Number,
  required: true,
  min: 0,
  max: 1_000_000_000,
  validate: Number.isSafeInteger,
};
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    currency: { type: String, enum: ['INR', 'USD', 'EUR', 'GBP'], default: 'INR', required: true },
    timezone: { type: String, default: 'Asia/Kolkata', required: true },
    sessionVersion: { type: Number, default: 0, required: true, select: false },
    isDemo: { type: Boolean, default: false, required: true },
  },
  { timestamps: true },
);
export type UserDocument = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = mongoose.model('User', userSchema);
const bucketSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    nameKey: { type: String, required: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    isDefault: { type: Boolean, default: false, required: true },
    isArchived: { type: Boolean, default: false, required: true },
    sortOrder: { type: Number, default: 0, required: true },
  },
  { timestamps: true },
);
bucketSchema.index(
  { userId: 1, nameKey: 1 },
  { unique: true, partialFilterExpression: { isArchived: false } },
);
export type BucketDocument = HydratedDocument<InferSchemaType<typeof bucketSchema>>;
export const Bucket = mongoose.model('Bucket', bucketSchema);
const budgetSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true },
    bucketId: { type: objectId, ref: 'Bucket', required: true },
    monthKey: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    amount: minorAmount,
  },
  { timestamps: true },
);
budgetSchema.index({ userId: 1, bucketId: 1, monthKey: 1 }, { unique: true });
export const BucketBudget = mongoose.model('BucketBudget', budgetSchema);
const transactionSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true },
    bucketId: { type: objectId, ref: 'Bucket', required: true },
    type: { type: String, enum: ['expense'], default: 'expense', required: true },
    description: { type: String, required: true, maxlength: 160, trim: true },
    amount: { ...minorAmount, min: 1 },
    transactionDate: { type: Date, required: true },
    notes: { type: String, default: '', maxlength: 1000 },
    requestId: { type: String },
  },
  { timestamps: true },
);
transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, bucketId: 1, transactionDate: -1 });
transactionSchema.index(
  { userId: 1, requestId: 1 },
  { unique: true, partialFilterExpression: { requestId: { $type: 'string' } } },
);
export type TransactionDocument = HydratedDocument<InferSchemaType<typeof transactionSchema>>;
export const Transaction = mongoose.model('Transaction', transactionSchema);
