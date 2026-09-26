import { useEffect, useMemo, useState } from 'react';
import { emptySession, recordAnswer, reviveSession, sessionAccuracy } from '../../domain/session';
import { SessionContext } from './sessionContext';

const STORAGE_KEY = 'spin-trainer.session.v1';

// sessionStorage: survives reloading the tab, is not shared between tabs. It may not exist or may fail (private mode).
function readStored() {
  try { return reviveSession(JSON.parse(globalThis.sessionStorage?.getItem(STORAGE_KEY) ?? 'null')); }
  catch { return emptySession(); }
}

/** Scoreboard of the current study session (Quiz answers). The history is the API's attempts. */
export function SessionProvider({ children }) {
  const [session, setSession] = useState(readStored);

  useEffect(() => {
    try { globalThis.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(session)); }
    catch { /* no persistence: the session stays in memory */ }
  }, [session]);

  const value = useMemo(() => ({
    session,
    accuracy: sessionAccuracy(session),
    record: correct => setSession(s => recordAnswer(s, correct)),
    reset: () => setSession(emptySession())
  }), [session]);

  return <SessionContext value={value}>{children}</SessionContext>;
}
