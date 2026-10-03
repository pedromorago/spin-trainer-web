/**
 * When the per-user caches start again (UserScope). Signing in from signed out keeps the scope: nothing of anyone's is
 * cached while nobody is signed in (RequireAuth keeps every data page away), so the page on screen keeps its state (the
 * landing's sign-in dialog goes on to where it pointed). The same holds for the user known once the stored session has
 * been read. Signing out, or into another account on the same tab, is a new generation: new caches, so nobody sees the
 * previous user's data.
 * @param scope {{ generation: number, userId: string | null, settled: boolean }} the current scope
 * @param auth {{ userId: string | null, loading: boolean }}
 * @returns the same scope when nothing changes, else the next one
 */
export function nextScope(scope, { userId, loading }) {
  if (loading) return scope;
  if (!scope.settled) return { generation: scope.generation, userId, settled: true };
  if (userId !== scope.userId) {
    return { generation: scope.userId === null ? scope.generation : scope.generation + 1, userId, settled: true };
  }
  return scope;
}

export const initialScope = ({ userId, loading }) => ({ generation: 0, userId, settled: !loading });
