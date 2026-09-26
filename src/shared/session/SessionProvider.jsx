import { useEffect, useMemo, useState } from 'react';
import { emptySession, recordAnswer, reviveSession, sessionAccuracy } from '../../domain/session';
import { SessionContext } from './sessionContext';

const STORAGE_KEY = 'spin-trainer.session.v1';

// sessionStorage: sobrevive a recargar la pestaña, no se comparte entre pestañas. Puede no existir o fallar (modo privado).
function readStored() {
  try { return reviveSession(JSON.parse(globalThis.sessionStorage?.getItem(STORAGE_KEY) ?? 'null')); }
  catch { return emptySession(); }
}

/** Marcador de la sesión de estudio en curso (respuestas del Quiz). El histórico son los intentos de la API. */
export function SessionProvider({ children }) {
  const [session, setSession] = useState(readStored);

  useEffect(() => {
    try { globalThis.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(session)); }
    catch { /* sin persistencia: la sesión sigue en memoria */ }
  }, [session]);

  const value = useMemo(() => ({
    session,
    accuracy: sessionAccuracy(session),
    record: correct => setSession(s => recordAnswer(s, correct)),
    reset: () => setSession(emptySession())
  }), [session]);

  return <SessionContext value={value}>{children}</SessionContext>;
}
