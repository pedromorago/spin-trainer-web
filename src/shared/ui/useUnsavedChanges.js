import { useCallback } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router';

/**
 * Protects unsaved changes: blocks internal navigation (including changing situation/stack, which lives in the URL)
 * and asks for the browser's confirmation when closing or reloading the tab. Returns the React Router blocker.
 */
export function useUnsavedChanges(dirty) {
  const blocker = useBlocker(({ currentLocation: a, nextLocation: b }) => dirty && (a.pathname !== b.pathname || a.search !== b.search));
  useBeforeUnload(useCallback(e => { if (dirty) e.preventDefault(); }, [dirty]));
  return blocker;
}
