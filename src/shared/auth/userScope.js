/**
 * When the per-user caches start again (UserScope). The user known once the stored session has been read joins the
 * scope that rendered while it was being read: the public pages already on screen (the landing) keep their state, and
 * nothing of anyone's was cached meanwhile (RequireAuth waits for it). Any later change of user (signing out, or into
 * another account on the same tab) is a new generation: new caches, so nobody sees the previous user's data.
 * @param scope {{ generation: number, userId: string | null, settled: boolean }} the current scope
 * @param auth {{ userId: string | null, loading: boolean }}
 * @returns the same scope when nothing changes, else the next one
 */
export function nextScope(scope, { userId, loading }) {
  if (loading) return scope;
  if (!scope.settled) return { generation: scope.generation, userId, settled: true };
  if (userId !== scope.userId) return { generation: scope.generation + 1, userId, settled: true };
  return scope;
}

export const initialScope = ({ userId, loading }) => ({ generation: 0, userId, settled: !loading });
