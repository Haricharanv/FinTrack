import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { AppLayout } from './components/layout';
import { ErrorState, Loading } from './components/ui';
import { useAuth, MonthProvider } from './lib/context';
import { message } from './lib/api';
import Auth from './pages/Auth';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AddExpense = lazy(() => import('./pages/AddExpense'));
const Buckets = lazy(() => import('./pages/Buckets'));
const BucketDetails = lazy(() => import('./pages/BucketDetails'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
function Protected() {
  const { user, loading, error, retry } = useAuth();
  if (loading) return <Loading />;
  if (error) return <ErrorState text={message(error)} retry={retry} />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <MonthProvider key={user.id}>
      <AppLayout />
    </MonthProvider>
  );
}
export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Auth key="login" mode="login" />} />
        <Route path="/register" element={<Auth key="register" mode="register" />} />
        <Route element={<Protected />}>
          <Route index element={<Dashboard />} />
          <Route path="add-expense" element={<AddExpense />} />
          <Route path="buckets" element={<Buckets />} />
          <Route path="buckets/:id" element={<BucketDetails />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route
            path="*"
            element={
              <div className="empty">
                <h1>A little off the path.</h1>
                <p>This page doesn’t exist.</p>
                <Link className="button button-primary" to="/">
                  Back to your overview
                </Link>
              </div>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
