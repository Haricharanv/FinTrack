import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, ArrowUpRight, Sprout } from 'lucide-react';
import { PageHeader, MonthSelect } from '../components/layout';
import { SummaryCards, TransactionTable } from '../components/finance';
import { SpendingTrend, Breakdown, BucketComparison } from '../components/charts';
import { Button, BucketIcon, Status, Loading, ErrorState, useToast } from '../components/ui';
import { get, message } from '../lib/api';
import { useAuth, useMonth } from '../lib/context';
import { money, monthTitle, downloadCSV } from '../lib/format';
import type { Overview, Transaction, PageResult } from '../lib/types';

export default function Reports() {
  const { month } = useMonth();
  const { user } = useAuth();
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['finance', 'report', month],
    queryFn: () => get<Overview>('/reports/monthly', { month }),
  });
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
  const top = [...data.buckets].sort((a, b) => b.spent - a.spent)[0];
  const exportReport = async () => {
    setExporting(true);
    try {
      const items: Transaction[] = [];
      let page = 1,
        pages = 1;
      do {
        const batch = await get<PageResult<Transaction>>('/transactions', {
          month,
          page,
          limit: 100,
        });
        items.push(...batch.items);
        pages = batch.pages;
        page++;
      } while (page <= pages);
      downloadCSV(
        [
          ['FinTrack monthly report', monthTitle(month)],
          ['Currency', user!.currency],
          ['Budget', data.budget / 100],
          ['Spent', data.spent / 100],
          ['Remaining', data.remaining / 100],
          [],
          ['Description', 'Bucket', 'Date', 'Amount', 'Notes'],
          ...items.map((t) => [t.description, t.bucket.name, t.dateKey, t.amount / 100, t.notes]),
        ],
        `fintrack-${month}.csv`,
      );
      toast('Your monthly report is ready.');
    } catch (e) {
      toast(message(e), 'error');
    } finally {
      setExporting(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="THE BIGGER PICTURE"
        title="Look back. Move forward."
        description={`Your ${monthTitle(month)} story, in a few thoughtful numbers.`}
      >
        <MonthSelect />
        <Button variant="secondary" onClick={exportReport} busy={exporting}>
          <Download size={16} />
          Export report
        </Button>
      </PageHeader>
      <SummaryCards data={data} />
      <div className="report-insights">
        <div>
          <span>
            <Sprout size={20} />
          </span>
          <p>
            <small>{data.remaining >= 0 ? 'Within your plan' : 'A moment to reset'}</small>
            <strong>
              {data.remaining >= 0
                ? `${money(data.remaining, user?.currency)} of breathing room`
                : `${money(-data.remaining, user?.currency)} above your plan`}
            </strong>
          </p>
        </div>
        <div>
          <span>
            <ArrowUpRight size={20} />
          </span>
          <p>
            <small>Largest spending bucket</small>
            <strong>
              {top?.spent
                ? `${top.name} · ${money(top.spent, user?.currency)}`
                : 'Waiting for your first expense'}
            </strong>
          </p>
        </div>
      </div>
      <div className="dashboard-charts">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Your spending over time</h2>
              <p>Six months of everyday decisions.</p>
            </div>
            <span className="chart-key">
              <i />
              Monthly total
            </span>
          </div>
          <SpendingTrend data={data} monthly />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>The month, divided</h2>
              <p>Every bucket has a part to play.</p>
            </div>
          </div>
          <Breakdown buckets={data.buckets} total={data.spent} />
        </section>
      </div>
      <section className="panel section-block">
        <div className="panel-heading">
          <div>
            <h2>Plans meet real life</h2>
            <p>Your budget alongside what you spent.</p>
          </div>
          <div className="chart-key-group">
            <span className="chart-key light">
              <i />
              Budget
            </span>
            <span className="chart-key">
              <i />
              Spent
            </span>
          </div>
        </div>
        <BucketComparison buckets={data.buckets} />
        <div className="table-scroll">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Bucket</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.buckets
                .filter((b) => !b.isArchived || b.spent || b.budget)
                .map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="transaction-description">
                        <BucketIcon bucket={b} size={17} />
                        <strong>{b.name}</strong>
                      </div>
                    </td>
                    <td>{money(b.budget, user?.currency)}</td>
                    <td>{money(b.spent, user?.currency)}</td>
                    <td>{money(b.remaining, user?.currency)}</td>
                    <td>
                      <Status status={b.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel section-block">
        <div className="panel-heading">
          <div>
            <h2>The latest entries</h2>
            <p>Recent expenses in this report.</p>
          </div>
        </div>
        <TransactionTable transactions={data.recent} compact />
      </section>
    </>
  );
}
