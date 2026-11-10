import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, NotebookPen, Sprout } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { ExpenseForm } from '../components/forms';
import { BucketCard } from '../components/finance';
import { useBuckets } from '../lib/api';
import { useAuth } from '../lib/context';
import { today } from '../lib/format';

export default function AddExpense() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const { data: buckets } = useBuckets(today(user?.timezone).slice(0, 7));
  return (
    <>
      <PageHeader
        eyebrow="ONE SMALL HABIT"
        title="Note it. Know it."
        description="The everyday things add up. Give this one a home."
      />
      <div className="expense-layout">
        <section className="panel form-panel">
          <div className="form-panel-heading">
            <span className="feature-icon">
              <NotebookPen size={23} />
            </span>
            <div>
              <h2>A new expense</h2>
              <p>Just a few details, then back to your day.</p>
            </div>
          </div>
          <ExpenseForm initialBucketId={params.get('bucket') || undefined} />
        </section>
        <aside className="expense-aside">
          <div className="section-heading">
            <div>
              <h2>Your buckets</h2>
              <p>A quick check before you spend.</p>
            </div>
          </div>
          {buckets
            ?.filter((b) => !b.isArchived)
            .slice(0, 3)
            .map((b) => (
              <BucketCard key={b.id} bucket={b} />
            ))}
          <Link to="/buckets" className="text-link">
            See all your buckets <ArrowRight size={15} />
          </Link>
          <div className="gentle-tip">
            <Sprout size={23} />
            <h3>Little notes. Lasting habits.</h3>
            <p>A clear description today makes your month easier to understand tomorrow.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
