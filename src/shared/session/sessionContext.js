import { createContext } from 'react';

/** Sesión de estudio: { session, accuracy, record(correct), reset() }. La provee SessionProvider. */
export const SessionContext = createContext(null);
