import type { Request, Response } from 'express';
import { User } from '../models/index.js';
import { env } from '../config/env.js';
import { registerSchema, loginSchema, profileSchema, passwordSchema } from '../validators/index.js';
import { registerAccount, login, userDTO, changePassword } from '../services/auth.js';
import { createDemo } from '../services/demo.js';
import { setSession, clearSession } from '../middleware/security.js';
import { ApiError } from '../utils/core.js';
const response = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });
export async function register(req: Request, res: Response) {
  const user = await registerAccount(registerSchema.parse(req.body));
  setSession(res, user);
  return response(res, { user: userDTO(user) }, 201);
}
export async function signIn(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const user = await login(input.email, input.password);
  setSession(res, user);
  return response(res, { user: userDTO(user) });
}
export async function signOut(req: Request, res: Response) {
  await User.updateOne({ _id: req.account._id }, { $inc: { sessionVersion: 1 } });
  clearSession(res);
  return response(res, { message: 'Signed out.' });
}
export async function me(req: Request, res: Response) {
  return response(res, { user: userDTO(req.account) });
}
export async function profile(req: Request, res: Response) {
  const values = profileSchema.parse(req.body);
  Object.assign(req.account, values);
  await req.account.save();
  return response(res, { user: userDTO(req.account) });
}
export async function password(req: Request, res: Response) {
  const values = passwordSchema.parse(req.body);
  const user = await changePassword(req.account, values.currentPassword, values.newPassword);
  setSession(res, user);
  return response(res, { message: 'Password updated.' });
}
export async function demo(_req: Request, res: Response) {
  if (!env.demoEnabled)
    throw new ApiError(
      403,
      'Demo workspaces are disabled on this installation. Create an account to get started.',
    );
  const user = await createDemo();
  setSession(res, user);
  return response(res, { user: userDTO(user) }, 201);
}
export function config(_req: Request, res: Response) {
  return response(res, { demoEnabled: env.demoEnabled });
}
