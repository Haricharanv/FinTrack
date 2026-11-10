import { randomUUID, randomBytes } from 'node:crypto';
import { registerAccount } from './auth.js';
import { Bucket, BucketBudget, Transaction, User } from '../models/index.js';
import { currentMonth, currentDate, localDate, shiftMonth } from '../utils/core.js';

export async function createDemo() {
  const user = await registerAccount(
    {
      name: 'Alex Morgan',
      email: `demo-${randomUUID()}@fintrack.local`,
      password: randomBytes(24).toString('hex'),
      timezone: 'Asia/Kolkata',
    },
    true,
  );
  try {
    const buckets = await Bucket.find({ userId: user._id }).sort({ sortOrder: 1 });
    const budgetValues = [8500, 4000, 6000, 18000, 3500, 5000, 3000, 3000, 2000, 2000, 2500];
    const month = currentMonth(user.timezone);
    const day = Number(currentDate(user.timezone).slice(-2));
    const entries: [string, number, number][] = [
      ['November rent', 15000, 3],
      ['The weekly grocery run', 1640, 0],
      ['Metro card top-up', 800, 1],
      ['Coffee at Third Wave', 240, 0],
      ['A little wardrobe refresh', 2450, 2],
      ['Electricity bill', 1450, 4],
      ['Dinner with friends', 1380, 0],
      ['Figma subscription', 799, 9],
      ['A ride across town', 320, 1],
      ['Fresh fruit & vegetables', 680, 0],
      ['Weekend movie night', 650, 7],
      ['Morning coffee', 180, 0],
      ['New running shoes', 1850, 2],
      ['Notebooks & stationery', 450, 5],
      ['Lunch at the little café', 420, 0],
      ['Spotify Premium', 119, 9],
      ['Pharmacy essentials', 540, 6],
      ['Auto ride home', 160, 1],
      ['A book for the weekend', 399, 5],
      ['A quick grocery stop', 860, 0],
      ['Haircut & a fresh start', 500, 8],
      ['Lunch with the team', 560, 0],
      ['Coffee & good conversation', 360, 0],
      ['A small gift', 750, 10],
    ];
    const budgetDocs = [];
    const txDocs = [];
    for (let offset = -5; offset <= 0; offset++) {
      const monthKey = shiftMonth(month, offset);
      for (let i = 0; i < buckets.length; i++)
        budgetDocs.push({
          userId: user._id,
          bucketId: buckets[i]._id,
          monthKey,
          amount: budgetValues[i] * 100,
        });
      const recordCount = offset === 0 ? Math.min(entries.length, day * 3) : entries.length;
      for (let i = 0; i < recordCount; i++) {
        const [description, amount, bucketIndex] = entries[i];
        const dateDay = offset === 0 ? Math.min(day, Math.floor(i / 3) + 1) : Math.min(28, i + 1);
        const factor = offset === 0 ? 1 : [1.16, 0.92, 1.1, 0.88, 1.08][offset + 5];
        txDocs.push({
          userId: user._id,
          bucketId: buckets[bucketIndex]._id,
          description:
            i === 0
              ? `${new Date(`${monthKey}-15T12:00:00Z`).toLocaleDateString('en', { month: 'long', timeZone: 'UTC' })} rent`
              : description,
          amount: Math.round(amount * factor * 100),
          transactionDate: localDate(
            `${monthKey}-${String(dateDay).padStart(2, '0')}`,
            user.timezone,
          ),
          notes: 'Sample record in your demo workspace.',
        });
      }
    }
    await BucketBudget.insertMany(budgetDocs);
    await Transaction.insertMany(txDocs);
    return user;
  } catch (e) {
    await Promise.all([
      Bucket.deleteMany({ userId: user._id }),
      BucketBudget.deleteMany({ userId: user._id }),
      Transaction.deleteMany({ userId: user._id }),
    ]);
    await User.deleteOne({ _id: user._id });
    throw e;
  }
}
