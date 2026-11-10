import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowRight,
  Leaf,
  Sparkles,
  Target,
  CalendarDays,
  Check,
  CircleAlert,
} from 'lucide-react';
import { Scene } from './layout';
import { MagicTiltCard } from './MagicTiltCard';
import { money, monthTitle } from '../lib/format';
import { useAuth } from '../lib/context';
import type { Overview } from '../lib/types';

export function DashboardHero({ data, onPlan }: { data: Overview; onPlan: () => void }) {
  const { user } = useAuth();
  const progress = Math.max(0, Math.min(data.utilization, 100));
  return (
    <section className="dashboard-hero editorial-hero" aria-label="Your monthly spending plan">
      <div className="hero-grain" aria-hidden="true" />
      <div className="hero-copy">
        <span className="hero-eyebrow">
          <Leaf size={13} /> A LITTLE MORE INTENTION
        </span>
        <h2>
          Good with money.
          <br />
          <span>Great with life.</span>
        </h2>
        <p>
          Less wondering where it went.
          <br />
          More room for where you’re going.
        </p>
        <button className="hero-plan-action" onClick={onPlan}>
          Shape this month <ArrowUpRight size={18} />
        </button>
        <span className="hero-footnote">
          <span />
          Your expenses. Your buckets. Your control.
        </span>
      </div>
      <div className="hero-art">
        <div className="hero-orbit" aria-hidden="true" />
        <Scene className="hero-scene" />
        <div className="hero-floating-note">
          <Sparkles size={15} />
          <span>Small steps. Real progress.</span>
        </div>
        <MagicTiltCard className="budget-pass" maxTilt={5}>
          <div className="budget-pass-heading">
            <span>YOUR MONTHLY PLAN</span>
            <Leaf size={18} />
          </div>
          <p>{monthTitle(data.monthKey)}</p>
          <div className="budget-pass-number">
            <strong>{money(Math.abs(data.remaining), user?.currency)}</strong>
            <span>
              {data.remaining < 0 ? 'over your monthly plan' : 'left in your monthly plan'}
            </span>
          </div>
          <div
            className="budget-pass-track"
            role="meter"
            aria-label="Monthly budget used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-valuetext={`${data.utilization.toFixed(1)}% of budget used`}
          >
            <i style={{ width: `${progress}%` }} />
          </div>
          <div className="budget-pass-footer">
            <span>
              {data.budget ? `${data.utilization.toFixed(0)}% used` : 'Ready for your first plan'}
            </span>
            <button onClick={onPlan} aria-label="Edit monthly spending plan">
              <ArrowUpRight size={18} />
            </button>
          </div>
        </MagicTiltCard>
      </div>
    </section>
  );
}

export function GettingStarted({ data, onPlan }: { data: Overview; onPlan: () => void }) {
  if (data.transactionCount || data.budget) return null;
  return (
    <section className="getting-started">
      <div>
        <span className="welcome-seed">
          <Leaf size={21} />
        </span>
        <h2>A fresh page. Make it yours.</h2>
        <p>Your buckets are ready. Two small steps to find your rhythm.</p>
      </div>
      <button onClick={onPlan}>
        <span>01</span>
        <div>
          <strong>Give your month a plan</strong>
          <small>Set limits for the things that matter.</small>
        </div>
        <ArrowRight size={18} />
      </button>
      <Link to="/add-expense">
        <span>02</span>
        <div>
          <strong>Note your first expense</strong>
          <small>A coffee is a perfectly good start.</small>
        </div>
        <ArrowRight size={18} />
      </Link>
    </section>
  );
}

export function SpendingInsights({ data }: { data: Overview }) {
  const { user } = useAuth();
  const attention = data.buckets.filter(
    (bucket) =>
      ['warning', 'reached', 'overspending'].includes(bucket.status) ||
      (bucket.status === 'unbudgeted' && bucket.spent > 0),
  );
  const past = data.pace.period === 'past';
  return (
    <section className="spending-insights" aria-label="Monthly insights">
      <article>
        <span className="insight-icon">
          <Target size={19} />
        </span>
        <div>
          <p>{past ? 'DAILY AVERAGE' : 'YOUR DAILY ROOM'}</p>
          <strong>
            {money(past ? data.pace.averageDailySpent : data.dailyAllowance, user?.currency)}
            <small> / day</small>
          </strong>
          <span>
            {past
              ? 'Across the selected month'
              : data.budget
                ? data.pace.period === 'future'
                  ? `${data.pace.totalDays} days in your upcoming plan`
                  : `${data.pace.remainingDays} days left in this plan, including today`
                : 'Set a monthly budget to get started'}
          </span>
        </div>
      </article>
      <article>
        <span className={`insight-icon ${attention.length ? 'amber' : ''}`}>
          {attention.length ? <CircleAlert size={19} /> : <Check size={19} />}
        </span>
        <div>
          <p>A GENTLE CHECK-IN</p>
          <strong>
            {attention.length
              ? `${attention.length} ${attention.length === 1 ? 'bucket needs' : 'buckets need'} a look`
              : data.budget
                ? 'A little breathing room'
                : 'Everything starts here'}
          </strong>
          <Link to={attention.length === 1 ? `/buckets/${attention[0].id}` : '/buckets'}>
            {attention.length
              ? `${attention
                  .slice(0, 2)
                  .map((bucket) => bucket.name)
                  .join(' & ')}${attention.length > 2 ? ` + ${attention.length - 2} more` : ''}`
              : 'Make space for your priorities'}{' '}
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </article>
      <article>
        <span className="insight-icon">
          <CalendarDays size={19} />
        </span>
        <div>
          <p>ONE DAY AT A TIME</p>
          <strong>
            {data.pace.spendingDays}
            <small> days with entries</small>
          </strong>
          <div className="month-dots" aria-hidden="true">
            {data.daily.map((day, index) => (
              <i
                key={day.day}
                className={
                  day.spent > 0 ? 'recorded' : index < data.pace.elapsedDays ? 'elapsed' : ''
                }
              />
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}
