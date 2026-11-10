import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { UserRound, ShieldCheck, LogOut, Globe, Check, Sun, Info } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { Button, FormError, Confirm, useToast } from '../components/ui';
import { useAuth } from '../lib/context';
import { send, message } from '../lib/api';
import { initials } from '../lib/format';
import type { User } from '../lib/types';

export default function Settings() {
  const { user, accept, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const profile = useForm({
    defaultValues: { name: user!.name, currency: user!.currency, timezone: user!.timezone },
  });
  const password = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  return (
    <>
      <PageHeader
        eyebrow="MAKE YOURSELF AT HOME"
        title="Your space. Your preferences."
        description="The little details that make FinTrack yours."
      />
      <div className="settings-layout">
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div className="settings-title">
              <UserRound size={20} />
              <div>
                <h2>Personal details</h2>
                <p>A familiar face in your financial notebook.</p>
              </div>
            </div>
          </div>
          <div className="profile-preview">
            <span className="avatar avatar-large">{initials(user!.name)}</span>
            <div>
              <h3>{user!.name}</h3>
              <p>{user!.email}</p>
            </div>
            {user?.isDemo && <span className="demo-pill">Demo account</span>}
          </div>
          <form
            className="stack"
            onSubmit={profile.handleSubmit(async (values) => {
              setProfileBusy(true);
              setError('');
              try {
                const result = await send<{ user: User }>('patch', '/auth/profile', values);
                accept(result.user);
                toast('Your preferences are saved.');
              } catch (e) {
                setError(message(e));
              } finally {
                setProfileBusy(false);
              }
            })}
          >
            <label className="field">
              Full name
              <input
                {...profile.register('name', {
                  required: 'Enter your name.',
                  setValueAs: (value: string) => value.trim(),
                  minLength: { value: 2, message: 'Use at least 2 characters.' },
                  maxLength: { value: 80, message: 'Use at most 80 characters.' },
                })}
                aria-invalid={!!profile.formState.errors.name}
              />
              <FormError>{profile.formState.errors.name?.message}</FormError>
            </label>
            <label className="field">
              Email address
              <input type="email" value={user!.email} readOnly />
              <small>Your email identifies this account.</small>
            </label>
            <div className="form-grid">
              <label className="field">
                Display currency
                <select {...profile.register('currency')}>
                  <option value="INR">INR — Indian rupee</option>
                  <option value="USD">USD — US dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British pound</option>
                </select>
              </label>
              <label className="field">
                Timezone
                <select {...profile.register('timezone')}>
                  {Array.from(
                    new Set([
                      user!.timezone,
                      'Asia/Kolkata',
                      'UTC',
                      'America/New_York',
                      'America/Los_Angeles',
                      'Europe/London',
                      'Europe/Paris',
                      'Asia/Dubai',
                      'Asia/Singapore',
                      'Australia/Sydney',
                    ]),
                  ).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="inline-note">
              <Info size={15} />
              Currency changes the display label; existing amounts are not converted. Timezone
              changes may regroup transactions near month boundaries.
            </p>
            <FormError>{error}</FormError>
            <Button type="submit" busy={profileBusy}>
              <Check size={16} />
              Save preferences
            </Button>
          </form>
        </section>
        <div className="settings-side">
          <section className="panel settings-panel">
            <div className="settings-title">
              <ShieldCheck size={21} />
              <div>
                <h2>Keep it secure</h2>
                <p>A fresh password, whenever you need.</p>
              </div>
            </div>
            <form
              className="stack"
              onSubmit={password.handleSubmit(async (values) => {
                if (values.newPassword !== values.confirmPassword) {
                  setPasswordError('The new passwords don’t match.');
                  return;
                }
                setPasswordBusy(true);
                setPasswordError('');
                try {
                  await send('patch', '/auth/change-password', {
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                  });
                  password.reset();
                  toast('Password updated. Other sessions have been signed out.');
                } catch (e) {
                  setPasswordError(message(e));
                } finally {
                  setPasswordBusy(false);
                }
              })}
            >
              <label className="field">
                Current password
                <input
                  {...password.register('currentPassword', {
                    required: 'Enter your current password.',
                  })}
                  type="password"
                  autoComplete="current-password"
                />
                <FormError>{password.formState.errors.currentPassword?.message}</FormError>
              </label>
              <label className="field">
                New password
                <input
                  {...password.register('newPassword', {
                    required: 'Enter a new password.',
                    minLength: { value: 10, message: 'Use at least 10 characters.' },
                    validate: (value) =>
                      new TextEncoder().encode(value).length <= 72 || 'Use at most 72 UTF-8 bytes.',
                  })}
                  type="password"
                  minLength={10}
                  autoComplete="new-password"
                  placeholder="At least 10 characters"
                />
                <FormError>{password.formState.errors.newPassword?.message}</FormError>
              </label>
              <label className="field">
                Confirm new password
                <input
                  {...password.register('confirmPassword', {
                    required: 'Confirm your new password.',
                  })}
                  type="password"
                  autoComplete="new-password"
                />
                <FormError>{password.formState.errors.confirmPassword?.message}</FormError>
              </label>
              <FormError>{passwordError}</FormError>
              <Button variant="secondary" busy={passwordBusy} type="submit">
                Update password
              </Button>
            </form>
          </section>
          <section className="panel appearance-card">
            <Sun size={22} />
            <div>
              <h3>A lighter perspective</h3>
              <p>FinTrack’s calm, light theme keeps the focus on what matters.</p>
            </div>
            <Check size={17} />
          </section>
          <Button variant="ghost" className="logout-button" onClick={() => setConfirm(true)}>
            <LogOut size={17} />
            Sign out of FinTrack
          </Button>
        </div>
      </div>
      <Confirm
        open={confirm}
        onClose={() => setConfirm(false)}
        title="See you soon?"
        description="Your notebook will be right here when you get back."
        busy={logoutBusy}
        onConfirm={async () => {
          setLogoutBusy(true);
          try {
            await logout();
            navigate('/login');
          } catch (e) {
            toast(message(e), 'error');
          } finally {
            setLogoutBusy(false);
          }
        }}
      />
    </>
  );
}
