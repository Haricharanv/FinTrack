import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import './styles.css';
import './refinements.css';
import App from './App';
import { AuthProvider } from './lib/context';
import { ToastProvider } from './components/ui';
import { AppErrorBoundary } from './components/AppErrorBoundary';
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: true } },
});
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <MotionConfig reducedMotion="user">
              <AppErrorBoundary>
                <App />
              </AppErrorBoundary>
            </MotionConfig>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
