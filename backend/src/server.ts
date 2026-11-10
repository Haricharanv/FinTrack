import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import mongoose from 'mongoose';

try {
  await connectDatabase();
  const server = app.listen(env.port, env.production ? '0.0.0.0' : '127.0.0.1', () =>
    console.log(`FinTrack API ready at http://localhost:${env.port} · MongoDB connected`),
  );
  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    server.close(() => {
      void mongoose.disconnect().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (error) {
  console.error('FinTrack could not start:', error instanceof Error ? error.message : error);
  console.error('Ensure MongoDB is running and MONGODB_URI is configured. See README.md.');
  process.exit(1);
}
