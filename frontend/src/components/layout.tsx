import { useEffect, useState, type ReactNode, lazy, Suspense } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { addMonths, format, parseISO } from 'date-fns';
import {
  LayoutGrid,
  Plus,
  Shapes,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Settings2,
  Search,
  Bell,
  ChevronDown,
  Menu,
  LogOut,
  ArrowUpRight,
  Sprout,
  CalendarDays,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Brand, Button, Modal, BucketIcon, Status, useToast } from './ui';
import { useAuth, useMonth } from '../lib/context';
import { useOverview, message } from '../lib/api';
import { initials, money, monthTitle } from '../lib/format';
export const BudgetScene = lazy(() => import('./BudgetScene'));
const links = [
  { to: '/', label: 'Overview', icon: LayoutGrid },
  { to: '/add-expense', label: 'Add expense', icon: Plus },
  { to: '/buckets', label: 'My buckets', icon: Shapes },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/reports', label: 'Monthly reports', icon: ChartNoAxesCombined },
];

export function PageHeader({
  eyebrow = 'YOUR FINANCIAL NOTEBOOK',
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      <div className="page-actions">{children}</div>
    </div>
  );
}
export function MonthSelect() {
  const { month, setMonth } = useMonth();
  const change = (value: string) => {
    if (/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(value)) setMonth(value);
  };
  const shift = (amount: number) =>
    change(format(addMonths(parseISO(`${month}-01`), amount), 'yyyy-MM'));
  return (
    <div className="month-control">
      <button
        className="month-arrow"
        aria-label="Previous month"
        disabled={month === '2000-01'}
        onClick={() => shift(-1)}
      >
        <ChevronLeft size={14} />
      </button>
      <label className="month-select">
        <CalendarDays size={15} />
        <span>{monthTitle(month)}</span>
        <input
          type="month"
          aria-label="Selected month"
          value={month}
          min="2000-01"
          max="2100-12"
          onInput={(e) => change(e.currentTarget.value)}
          onChange={(e) => change(e.target.value)}
        />
      </label>
      <button
        className="month-arrow"
        aria-label="Next month"
        disabled={month === '2100-12'}
        onClick={() => shift(1)}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
export function Scene({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <Suspense fallback={<div className="budget-scene" />}>
        <BudgetScene />
      </Suspense>
    </div>
  );
}
export function AppLayout() {
  const { user, logout } = useAuth();
  const { month } = useMonth();
  const { data } = useOverview(month);
  const notify = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => setMobile(false), [location.pathname]);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === 'Escape') setMobile(false);
      const target = e.target as HTMLElement;
      if (
        e.key.toLowerCase() === 'n' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) &&
        !target.isContentEditable &&
        !document.querySelector('[role=dialog]')
      ) {
        e.preventDefault();
        navigate('/add-expense');
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [navigate]);
  const alerts =
    data?.buckets.filter((b) => ['warning', 'reached', 'overspending'].includes(b.status)) || [];
  const sidebar = (
    <>
      <NavLink to="/" className="brand-link" aria-label="FinTrack home">
        <Brand />
      </NavLink>
      <div className="workspace-label">
        <span className="workspace-dot" />
        Personal workspace
        <ChevronDown size={13} />
      </div>
      <p className="nav-section-label">WORKSPACE</p>
      <nav className="main-nav" aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <Icon size={19} strokeWidth={1.7} />
            <span>{label}</span>
            {to === '/add-expense' && <kbd>N</kbd>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span className="note-sprout">
            <Sprout size={23} />
          </span>
          <h3>
            A little today.
            <br />A lot tomorrow.
          </h3>
          <p>
            Good money habits start
            <br />
            with a little clarity.
          </p>
          <NavLink to="/reports">
            See your progress <ArrowUpRight size={15} />
          </NavLink>
        </div>
        <NavLink to="/settings" className="nav-link">
          <Settings2 size={19} strokeWidth={1.7} />
          <span>Settings</span>
        </NavLink>
        <button className="sidebar-profile" onClick={() => navigate('/settings')}>
          <span className="avatar">{initials(user!.name)}</span>
          <span>
            <strong>{user!.name}</strong>
            <small>{user?.isDemo ? 'Demo workspace' : 'Personal account'}</small>
          </span>
          <ChevronDown size={14} />
        </button>
      </div>
    </>
  );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">{sidebar}</aside>
      <Modal
        open={mobile}
        onOpenChange={setMobile}
        title="Your workspace"
        description="Navigate FinTrack"
      >
        <div className="mobile-nav-content">{sidebar}</div>
      </Modal>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span>{' '}
              <strong>
                {location.pathname.startsWith('/settings')
                  ? 'Settings'
                  : links.find((l) => l.to !== '/' && location.pathname.startsWith(l.to))?.label ||
                    'Overview'}
              </strong>
            </span>
          </div>
          <div className="topbar-actions">
            <button
              className="search-trigger"
              aria-label="Search transactions"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={17} />
              <span>Search transactions</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="topbar-divider" />
            <button
              className="icon-button notification-button"
              aria-label={`Budget notifications${alerts.length ? `, ${alerts.length} alerts` : ''}`}
              onClick={() => setNotifications(true)}
            >
              <Bell size={19} />
              {alerts.length > 0 && <i />}
            </button>
            <button
              className="avatar avatar-small"
              aria-label="Your profile"
              onClick={() => navigate('/settings')}
            >
              {initials(user!.name)}
            </button>
          </div>
        </header>
        {user?.isDemo && (
          <div className="demo-banner">
            <span>Demo workspace · Explore with sample records saved in MongoDB.</span>
            <button
              disabled={loggingOut}
              onClick={async () => {
                setLoggingOut(true);
                try {
                  await logout();
                  navigate('/register');
                } catch (e) {
                  notify(message(e), 'error');
                } finally {
                  setLoggingOut(false);
                }
              }}
            >
              Create your account <ArrowUpRight size={13} />
            </button>
          </div>
        )}
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Make room for what matters.</span>
          <span>
            FinTrack <span>·</span> Your money, a little clearer.
          </span>
        </footer>
      </div>
      <Modal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Find a transaction"
        description="Search descriptions in your expense notebook."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/transactions?search=${encodeURIComponent(search)}`);
            setSearchOpen(false);
          }}
          className="stack"
        >
          <label className="field">
            Search
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Coffee, groceries, rent…"
            />
          </label>
          <Button type="submit">
            Search transactions <Search size={16} />
          </Button>
        </form>
      </Modal>
      <Modal
        open={notifications}
        onOpenChange={setNotifications}
        title="Budget check-in"
        description={`Updates for ${monthTitle(month)}.`}
      >
        {alerts.length ? (
          <div className="notification-list">
            {alerts.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setNotifications(false);
                  navigate(`/buckets/${b.id}`);
                }}
              >
                <BucketIcon bucket={b} />
                <span>
                  <strong>{b.name}</strong>
                  <small>
                    {money(b.spent, user?.currency)} of {money(b.budget, user?.currency)}
                  </small>
                  <Status status={b.status} />
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        ) : (
          <div className="notification-empty">
            <Sprout size={30} />
            <h3>All quiet here.</h3>
            <p>No buckets are approaching their limit this month.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
