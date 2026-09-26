import { Navigate } from 'react-router';
import { RequireAuth } from './shared/auth/RequireAuth';
import { Layout } from './shared/ui/Layout';
import { LoginPage } from './features/auth/LoginPage';
import { ExplorerPage } from './features/explorer/ExplorerPage';
import { QuizPage } from './features/quiz/QuizPage';
import { BuilderPage } from './features/builder/BuilderPage';
import { StatsPage } from './features/stats/StatsPage';

/** Rutas para createBrowserRouter (data mode: habilita useBlocker en el Builder). */
export const routes = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth><Layout /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/explorer" replace /> },
      { path: 'explorer', element: <ExplorerPage /> },
      { path: 'quiz', element: <QuizPage /> },
      { path: 'builder', element: <BuilderPage /> },
      { path: 'stats', element: <StatsPage /> }
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }
];
