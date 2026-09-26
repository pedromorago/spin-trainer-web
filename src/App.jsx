import { Navigate } from 'react-router';
import { RequireAuth } from './shared/auth/RequireAuth';
import { Layout } from './shared/ui/Layout';
import { LoginPage } from './features/auth/LoginPage';

// Cada feature en su propio chunk: se descarga al entrar en la ruta.
const page = (load, name) => () => load().then(m => ({ Component: m[name] }));

/** Rutas para createBrowserRouter (data mode: habilita useBlocker en el Builder y rutas lazy). */
export const routes = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth><Layout /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/explorer" replace /> },
      { path: 'explorer', lazy: page(() => import('./features/explorer/ExplorerPage'), 'ExplorerPage') },
      { path: 'quiz', lazy: page(() => import('./features/quiz/QuizPage'), 'QuizPage') },
      { path: 'builder', lazy: page(() => import('./features/builder/BuilderPage'), 'BuilderPage') },
      { path: 'stats', lazy: page(() => import('./features/stats/StatsPage'), 'StatsPage') }
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }
];
