import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { retryDelay, shouldRetry } from './shared/api/retry';
import { useAuth } from './shared/auth/useAuth';
import { initialScope, nextScope } from './shared/auth/userScope';
import { SessionProvider } from './shared/session/SessionProvider';

/**
 * What is cached belongs to one user: the query cache and the session scoreboard are created again when the user
 * changes (signing out and into another account on the same tab), so nobody sees the previous user's ranges or stats.
 * Signing in from signed out (including reading the stored session at start-up) keeps the page (userScope.js).
 */
export function UserScope({ children }) {
  const { user, loading } = useAuth();
  const auth = { userId: user?.id ?? null, loading };
  const [scope, setScope] = useState(() => initialScope(auth));
  const next = nextScope(scope, auth);
  // Adjusting state while rendering (React's pattern for state derived from props): no extra commit with stale caches.
  if (next !== scope) setScope(next);
  return <UserCaches key={next.generation} userId={auth.userId}>{children}</UserCaches>;
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
