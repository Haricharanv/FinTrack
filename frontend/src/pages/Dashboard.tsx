import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ArrowUpRight, ArrowRight, Sprout, TrendingDown } from 'lucide-react';
import { useAuth, useMonth } from '../lib/context';
import { useOverview, message } from '../lib/api';
import { money, monthTitle } from '../lib/format';
import { Loading, ErrorState } from '../components/ui';
import { PageHeader, MonthSelect } from '../components/layout';
import { SummaryCards, BucketCard, TransactionTable } from '../components/finance';
import { SpendingTrend, Breakdown } from '../components/charts';
import { DashboardHero, GettingStarted, SpendingInsights } from '../components/DashboardStory';
import { BudgetPlanner } from '../components/BudgetPlanner';

export default function Dashboard() {
  const { user } = useAuth();
  const { month } = useMonth();
  const [planning, setPlanning] = useState(false);
  const { data, isPending, error, refetch } = useOverview(month);
  if (isPending) return <Loading />;
  if (error || !data)
    return (
      <ErrorState
        text={message(error)}
        retry={() => {
          void refetch();
        }}
      />
    );
  const first = user!.name.split(' ')[0];
  const change = data.previousSpent
    ? ((data.spent - data.previousSpent) / data.previousSpent) * 100
    : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        eyebrow={`YOUR EVERYDAY, A LITTLE CLEARER`}
        title={`Welcome back, ${first}.`}
        description="A little overview. A lot more peace of mind."
      >
        <MonthSelect />
        <Link to="/add-expense" className="button button-primary">
          <Plus size={17} />
          Add expense
        </Link>
      </PageHeader>
      <DashboardHero data={data} onPlan={() => setPlanning(true)} />
      <GettingStarted data={data} onPlan={() => setPlanning(true)} />
      <SummaryCards data={data} />
      <SpendingInsights data={data} />
      <div className="dashboard-charts">
        <section className="panel trend-panel">
          <div className="panel-heading">
            <div>
              <h2>
                Spending rhythm <span className="subtle-dot" />
              </h2>
              <p>A daily look at your month</p>
            </div>
            <span className="chart-key">
              <i />
              Expenses
            </span>
          </div>
          <div className="chart-headline">
            <strong>{money(data.spent, user?.currency)}</strong>
            {change !== null && (
              <span className={`comparison-note ${change <= 0 ? 'good' : ''}`}>
                <TrendingDown size={13} style={change > 0 ? { transform: 'rotate(180deg)' } : {}} />
                {Math.abs(change).toFixed(0)}% {change > 0 ? 'more' : 'less'} than last month’s
                total
              </span>
            )}
          </div>
          <SpendingTrend data={data} />
        </section>
        <section className="panel breakdown-panel">
          <div className="panel-heading">
            <div>
              <h2>Where it goes</h2>
              <p>A little perspective on your spending</p>
            </div>
            <Link to="/reports" className="icon-button" aria-label="View spending reports">
              <ArrowUpRight size={19} />
            </Link>
          </div>
          <Breakdown buckets={data.buckets} total={data.spent} />
        </section>
      </div>
      <section className="section-block">
        <div className="section-heading">
          <div>
            <h2>
              Your buckets{' '}
              <span className="count-pill">{data.buckets.filter((b) => !b.isArchived).length}</span>
            </h2>
            <p>A place for every part of your life.</p>
          </div>
          <Link to="/buckets" className="text-link">
            View all buckets <ArrowRight size={16} />
          </Link>
        </div>
        <div className="bucket-grid preview-buckets">
          {data.buckets
            .filter((b) => !b.isArchived)
            .slice(0, 3)
            .map((b) => (
              <BucketCard bucket={b} key={b.id} />
            ))}
        </div>
      </section>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent transactions</h2>
            <p>The little things, all accounted for.</p>
          </div>
          <Link to="/transactions" className="text-link">
            View all <ArrowRight size={15} />
          </Link>
        </div>
        <TransactionTable transactions={data.recent} compact />
      </section>
      <div className="bottom-insight">
        <span>
          <Sprout size={21} />
        </span>
        <p>
          {data.remaining > 0 && data.dailyAllowance > 0 ? (
            <>
              <strong>A little breathing room.</strong> You have{' '}
              {money(data.dailyAllowance, user?.currency)} per remaining day within your{' '}
              {monthTitle(month)} budget.
            </>
          ) : (
            <>
              <strong>Progress starts with paying attention.</strong> Your next expense is a good
              place to begin.
            </>
          )}
        </p>
        <Link to="/reports" aria-label="Open monthly report">
          <ArrowUpRight size={18} />
        </Link>
      </div>
      {planning && (
        <BudgetPlanner key={month} buckets={data.buckets} onClose={() => setPlanning(false)} />
      )}
    </motion.div>
  );
}
