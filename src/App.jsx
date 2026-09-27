import { RequireAuth } from './shared/auth/RequireAuth';
import { AuthCallbackPage } from './features/auth/AuthCallbackPage';
import { LoginPage } from './features/auth/LoginPage';
import { LogoutPage } from './features/auth/LogoutPage';
import { AppShell } from './features/shell/AppShell';
import { RedirectTo } from './features/shell/RedirectTo';
import { RouteErrorPage } from './features/shell/RouteErrorPage';

// Each feature in its own chunk: downloaded when entering the route.
const page = (load, name) => () => load().then(m => ({ Component: m[name] }));

/** Routes for createBrowserRouter (data mode: enables useBlocker in the Builder and lazy routes). */
export const routes = [
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorPage standalone /> },
  { path: '/logout', element: <LogoutPage />, errorElement: <RouteErrorPage standalone /> },
  // Public: Google's return (ADR-0019) and the privacy notice, which must be readable before having an account.
  { path: '/auth/callback', element: <AuthCallbackPage />, errorElement: <RouteErrorPage standalone /> },
  {
    path: '/privacidad',
    lazy: page(() => import('./features/legal/PrivacyPage'), 'PrivacyPage'),
    errorElement: <RouteErrorPage standalone />
  },
  {
    element: <RequireAuth><AppShell /></RequireAuth>,
    errorElement: <RouteErrorPage standalone />,
    children: [
      {
        // A page that fails (render or chunk download) keeps the shell: the header still switches tabs.
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <RedirectTo pathname="/explorer" /> },
          { path: 'explorer', lazy: page(() => import('./features/explorer/ExplorerPage'), 'ExplorerPage') },
          { path: 'quiz', lazy: page(() => import('./features/quiz/QuizPage'), 'QuizPage') },
          { path: 'builder', lazy: page(() => import('./features/builder/BuilderPage'), 'BuilderPage') },
          { path: 'stats', lazy: page(() => import('./features/stats/StatsPage'), 'StatsPage') }
        ]
      }
    ]
  },
  { path: '*', element: <RedirectTo pathname="/" /> }
];
