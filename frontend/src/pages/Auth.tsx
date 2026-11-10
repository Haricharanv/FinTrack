import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Leaf, ShieldCheck, Sparkles, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Brand, Button, FormError, Loading, useToast } from '../components/ui';
import { Scene } from '../components/layout';
import { get, send, message } from '../lib/api';
import { useAuth } from '../lib/context';
import type { User } from '../lib/types';

const schema = z.object({
  name: z.string().optional(),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  confirm: z.string().optional(),
});
type Fields = z.infer<typeof schema>;
export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const { user, loading, accept } = useAuth();
  const navigate = useNavigate();
  const notify = useToast();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [error, setError] = useState('');
  const { data: authConfig } = useQuery({
    queryKey: ['auth-config'],
    queryFn: () => get<{ demoEnabled: boolean }>('/auth/config'),
    staleTime: 60_000,
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: fieldError,
  } = useForm<Fields>({ resolver: zodResolver(schema) });
  if (loading) return <Loading />;
  if (user) return <Navigate to="/" replace />;
  const submit = async (values: Fields) => {
    if (busy) return;
    if (isRegister) {
      if (!values.name || values.name.trim().length < 2)
        return fieldError('name', { message: 'Tell us your name (at least 2 characters).' });
      if (values.password.length < 10)
        return fieldError('password', { message: 'Use at least 10 characters.' });
      if (values.password !== values.confirm)
        return fieldError('confirm', { message: 'Your passwords don’t match yet.' });
    }
    setBusy(true);
    setError('');
    try {
      const result = await send<{ user: User }>('post', `/auth/${mode}`, {
        name: values.name,
        email: values.email,
        password: values.password,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      accept(result.user);
      navigate('/');
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  const demo = async () => {
    setDemoBusy(true);
    setError('');
    try {
      const result = await send<{ user: User }>('post', '/auth/demo');
      accept(result.user);
      notify('Your own demo workspace is ready to explore.');
      navigate('/');
    } catch (e) {
      setError(message(e));
    } finally {
      setDemoBusy(false);
    }
  };
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Brand light />
        <div className="auth-story-main">
          <span className="auth-pill">
            <Leaf size={14} />A calmer relationship with money
          </span>
          <h1>
            Small habits.
            <br />
            Bigger possibilities.
          </h1>
          <p>
            Your expenses. Your buckets. Your control.
            <br />
            Give every rupee a little more intention.
          </p>
          <Scene className="auth-scene" />
          <div className="auth-story-caption">
            <span>
              <Check size={15} />
              Know where it goes
            </span>
            <span>
              <Check size={15} />
              Make room for more
            </span>
          </div>
        </div>
        <div className="auth-story-footer">
          <span>MADE FOR THE EVERYDAY</span>
          <span>Not just the numbers.</span>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-topline">
          <span>{isRegister ? 'Already found your rhythm?' : 'New around here?'}</span>
          <Link to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Sign in' : 'Create an account'} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="auth-form-inner">
          <span className="auth-welcome-icon">
            <Leaf size={25} />
          </span>
          <p className="eyebrow">A LITTLE CLARITY STARTS HERE</p>
          <h2>{isRegister ? 'Make yourself at home.' : 'Welcome back.'}</h2>
          <p className="auth-subtitle">
            {isRegister
              ? 'Build better money habits, one day at a time.'
              : 'Let’s pick up where you left off.'}
          </p>
          <form onSubmit={handleSubmit(submit)} className="stack" noValidate>
            {isRegister && (
              <label className="field">
                Full name
                <input
                  {...register('name')}
                  autoComplete="name"
                  placeholder="What should we call you?"
                />
                <FormError>{errors.name?.message}</FormError>
              </label>
            )}
            <label className="field">
              Email address
              <input
                {...register('email')}
                autoComplete="email"
                type="email"
                placeholder="you@example.com"
              />
              <FormError>{errors.email?.message}</FormError>
            </label>
            <label className="field">
              Password
              <span className="password-input">
                <input
                  {...register('password')}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  type={show ? 'text' : 'password'}
                  placeholder={isRegister ? 'At least 10 characters' : 'Your password'}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow((v) => !v)}
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
              <FormError>{errors.password?.message}</FormError>
            </label>
            {isRegister && (
              <label className="field">
                Confirm password
                <input
                  {...register('confirm')}
                  autoComplete="new-password"
                  type={show ? 'text' : 'password'}
                  placeholder="Once more, just to be sure"
                />
                <FormError>{errors.confirm?.message}</FormError>
              </label>
            )}
            <FormError>{error}</FormError>
            <Button type="submit" busy={busy} disabled={demoBusy}>
              {isRegister ? 'Create my account' : 'Sign in'}
              <ArrowRight size={17} className="push-right" />
            </Button>
          </form>
          {authConfig?.demoEnabled && (
            <>
              <div className="auth-separator">
                <span />
                or take a look around
                <span />
              </div>
              <Button
                variant="secondary"
                className="full-width"
                onClick={demo}
                busy={demoBusy}
                disabled={busy}
              >
                <Sparkles size={17} />
                Explore the demo
                <ArrowUpRightIcon />
              </Button>
              <p className="auth-demo-note">A private sample workspace. No sign-up needed.</p>
            </>
          )}
          <div className="auth-privacy">
            <ShieldCheck size={15} />
            Your notebook is yours. No bank connection required.
          </div>
        </div>
        <footer className="auth-footer">
          A little clarity. A little confidence. <span>That’s FinTrack.</span>
        </footer>
      </section>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={16} className="push-right" style={{ transform: 'rotate(-40deg)' }} />;
}
