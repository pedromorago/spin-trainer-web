import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { retryDelay, shouldRetry } from './shared/api/retry';
import { useAuth } from './shared/auth/useAuth';
import { SessionProvider } from './shared/session/SessionProvider';

/**
 * What is cached belongs to one user: the query cache and the session scoreboard are created again when the user
 * changes (signing out and into another account on the same tab), so nobody sees the previous user's ranges or stats.
 */
export function UserScope({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  return <UserCaches key={userId ?? 'anonymous'} userId={userId}>{children}</UserCaches>;
}

function UserCaches({ userId, children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: shouldRetry, retryDelay, refetchOnWindowFocus: false } }
  }));
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider userId={userId}>{children}</SessionProvider>
    </QueryClientProvider>
  );
}
