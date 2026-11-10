import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: resolve(projectRoot, '.env'), quiet: true });
const production = process.env.NODE_ENV === 'production';
function secret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) return process.env.JWT_SECRET;
  if (production) throw new Error('Production requires JWT_SECRET with at least 32 characters.');
  const folder = resolve(projectRoot, '.local');
  const file = resolve(folder, 'jwt-secret');
  mkdirSync(folder, { recursive: true, mode: 0o700 });
  if (!existsSync(file))
    writeFileSync(file, randomBytes(48).toString('hex'), { mode: 0o600, flag: 'wx' });
  return readFileSync(file, 'utf8').trim();
}
if (production && !process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in production.');
if (production && !process.env.CLIENT_ORIGIN?.startsWith('https://'))
  throw new Error('Set CLIENT_ORIGIN to the production HTTPS origin.');
export const env = {
  production,
  port: Number(process.env.PORT || 4000),
  mongodb: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fintrack',
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: secret(),
  demoEnabled:
    process.env.ENABLE_DEMO === 'true' || (!production && process.env.ENABLE_DEMO !== 'false'),
  trustProxy: Number(process.env.TRUST_PROXY || 0),
};
export const allowedOrigins = new Set([
  env.origin,
  ...(!env.production
    ? [
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        `http://127.0.0.1:${env.port}`,
        `http://localhost:${env.port}`,
      ]
    : []),
]);
