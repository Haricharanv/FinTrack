import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Overview, Bucket } from '../lib/types';
import { money, today } from '../lib/format';
import { useAuth } from '../lib/context';
import { Empty } from './ui';

export function SpendingTrend({ data, monthly = false }: { data: Overview; monthly?: boolean }) {
  const { user } = useAuth();
  const currency = user?.currency;
  const points = monthly
    ? data.trend.map((p) => ({
        label: new Date(`${p.month}-15T12:00:00`).toLocaleDateString('en', { month: 'short' }),
        spent: p.spent,
      }))
    : data.daily
        .filter((p) => p.day <= today(user?.timezone))
        .map((p) => ({ label: p.day.slice(-2), spent: p.spent }));
  return (
    <div
      className="trend-chart"
      role="img"
      aria-label={
        monthly
          ? 'Monthly spending totals for the last six months'
          : 'Daily spending during the selected month'
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 16, right: 8, bottom: 2, left: -13 }}>
          <defs>
            <linearGradient id={monthly ? 'monthlyFill' : 'dailyFill'} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#81ae76" stopOpacity={0.28} />
              <stop offset="98%" stopColor="#81ae76" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e9ede6" vertical={false} strokeDasharray="3 5" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#7d887f', fontSize: 11 }}
            minTickGap={30}
            dy={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#7d887f', fontSize: 11 }}
            tickFormatter={(v) => money(Number(v), currency, true)}
            width={67}
          />
          <Tooltip
            formatter={(value) => [money(Number(value), currency), 'Spent']}
            labelFormatter={(label) =>
              monthly
                ? String(label)
                : `${label} ${new Date(`${data.monthKey}-15`).toLocaleDateString('en', { month: 'short' })}`
            }
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e6ebe2',
              boxShadow: '0 6px 24px #193b2910',
              fontSize: 13,
            }}
          />
          <Area
            type="monotone"
            dataKey="spent"
            stroke="#4f8255"
            strokeWidth={2.5}
            fill={`url(#${monthly ? 'monthlyFill' : 'dailyFill'})`}
            activeDot={{ r: 5, fill: '#356342', stroke: '#fff', strokeWidth: 3 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Breakdown({ buckets, total }: { buckets: Bucket[]; total: number }) {
  const { user } = useAuth();
  const active = buckets.filter((b) => b.spent > 0).sort((a, b) => b.spent - a.spent);
  if (!active.length)
    return <Empty title="A fresh start">Add an expense to see where your money goes.</Empty>;
  return (
    <div className="breakdown">
      <div className="donut-wrap" role="img" aria-label="Spending distribution by bucket">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={active}
              dataKey="spent"
              nameKey="name"
              innerRadius="72%"
              outerRadius="94%"
              paddingAngle={4}
              cornerRadius={4}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {active.map((b) => (
                <Cell key={b.id} fill={b.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => money(Number(v), user?.currency)}
              contentStyle={{ borderRadius: 12, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-label">
          <small>Total spent</small>
          <strong>{money(total, user?.currency)}</strong>
          <span>across {active.length} buckets</span>
        </div>
      </div>
      <div className="chart-legend">
        {active.slice(0, 4).map((b) => (
          <div key={b.id}>
            <span>
              <i style={{ background: b.color }} />
              {b.name}
            </span>
            <strong>{Math.round((b.spent / total) * 100)}%</strong>
          </div>
        ))}
        {active.length > 4 && (
          <div>
            <span>
              <i style={{ background: '#b9c3b5' }} />
              Other buckets
            </span>
            <strong>
              {Math.round((active.slice(4).reduce((n, b) => n + b.spent, 0) / total) * 100)}%
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}
export function BucketComparison({ buckets }: { buckets: Bucket[] }) {
  const { user } = useAuth();
  return (
    <div
      className="comparison-chart"
      role="img"
      aria-label="Budget and spending comparison by bucket"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={buckets.filter((b) => b.budget || b.spent)}
          margin={{ left: -12, top: 15, bottom: 4 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 5" stroke="#e9ede6" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#68766e' }}
            interval={0}
            tickFormatter={(v) => String(v).split(' ')[0]}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#68766e' }}
            tickFormatter={(v) => money(Number(v), user?.currency, true)}
          />
          <Tooltip
            formatter={(v) => money(Number(v), user?.currency)}
            contentStyle={{ borderRadius: 12 }}
          />
          <Bar
            dataKey="budget"
            name="Budget"
            fill="#dfead8"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="spent"
            name="Spent"
            fill="#517b54"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
