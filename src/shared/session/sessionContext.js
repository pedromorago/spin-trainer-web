import { createContext } from 'react';

/** Study session: { session, accuracy, record(correct), reset() }. Provided by SessionProvider. */
export const SessionContext = createContext(null);
