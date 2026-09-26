import { Navigate } from 'react-router';
import { RequireAuth } from './shared/auth/RequireAuth';
import { LoginPage } from './features/auth/LoginPage';
import { AppShell } from './features/shell/AppShell';

// Each feature in its own chunk: downloaded when entering the route.
const page = (load, name) => () => load().then(m => ({ Component: m[name] }));

/** Routes for createBrowserRouter (data mode: enables useBlocker in the Builder and lazy routes). */
export const routes = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth><AppShell /></RequireAuth>,
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
