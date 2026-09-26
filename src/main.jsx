import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routes } from './App';
import { retryDelay, shouldRetry } from './shared/api/retry';
import { AuthProvider } from './shared/auth/AuthProvider';
import { SessionProvider } from './shared/session/SessionProvider';
import '@fontsource/bebas-neue/400.css';
import '@fontsource-variable/dm-sans/index.css';
import '@fontsource-variable/jetbrains-mono/index.css';
import './shared/theme/global.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: shouldRetry, retryDelay, refetchOnWindowFocus: false } }
});

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
