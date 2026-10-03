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
 * Another `userId` switches to that user's own stored scoreboard (the user known once the stored session is read).
 */
export function SessionProvider({ userId, children }) {
  const key = storageKey(userId);
  const [stored, setStored] = useState(() => ({ key, session: readStored(key) }));
  // Adjusted while rendering, so the old user's scoreboard is never shown, nor saved under the new user's key.
  const current = stored.key === key ? stored : { key, session: readStored(key) };
  if (current !== stored) setStored(current);
  const { session } = current;

  useEffect(() => {
    try { globalThis.sessionStorage?.setItem(key, JSON.stringify(session)); }
    catch { /* no persistence: the session stays in memory */ }
  }, [key, session]);

  const value = useMemo(() => {
    const update = change => setStored(s => ({ key: s.key, session: change(s.session) }));
    return {
      session,
      accuracy: sessionAccuracy(session),
      record: correct => update(s => recordAnswer(s, correct)),
      reset: () => update(() => emptySession())
    };
  }, [session]);

  return <SessionContext value={value}>{children}</SessionContext>;
}
