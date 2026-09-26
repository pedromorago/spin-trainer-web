import { useEffect, useMemo, useState } from 'react';
import { emptySession, recordAnswer, reviveSession, sessionAccuracy } from '../../domain/session';
import { SessionContext } from './sessionContext';

// One scoreboard per user: another account signing in on the same tab does not inherit it.
const storageKey = userId => `spin-trainer.session.v1:${userId ?? 'anonymous'}`;

// sessionStorage: survives reloading the tab, is not shared between tabs. It may not exist or may fail (private mode).
function readStored(key) {
  try { return reviveSession(JSON.parse(globalThis.sessionStorage?.getItem(key) ?? 'null')); }
  catch { return emptySession(); }
}

/**
 * Scoreboard of the current study session (Quiz answers) of `userId`. The history is the API's attempts.
 * Mounted with key={userId}: a different user starts from their own stored scoreboard.
 */
export function SessionProvider({ userId, children }) {
  const key = storageKey(userId);
  const [session, setSession] = useState(() => readStored(key));

  useEffect(() => {
    try { globalThis.sessionStorage?.setItem(key, JSON.stringify(session)); }
    catch { /* no persistence: the session stays in memory */ }
  }, [key, session]);

  const value = useMemo(() => ({
    session,
    accuracy: sessionAccuracy(session),
    record: correct => setSession(s => recordAnswer(s, correct)),
    reset: () => setSession(emptySession())
  }), [session]);

  return <SessionContext value={value}>{children}</SessionContext>;
}
