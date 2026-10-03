import { Navigate } from 'react-router';
import { RequireAuth } from './shared/auth/RequireAuth';
import { GoogleReturnPage } from './features/auth/GoogleReturnPage';
import { LoginPage } from './features/auth/LoginPage';
import { LandingPage } from './features/landing/LandingPage';
import { LogoutPage } from './features/auth/LogoutPage';
import { AppShell } from './features/shell/AppShell';
import { RedirectTo } from './features/shell/RedirectTo';
import { RouteErrorPage } from './features/shell/RouteErrorPage';

// Each feature in its own chunk: downloaded when entering the route.
const page = (load, name) => () => load().then(m => ({ Component: m[name] }));

/** Routes for createBrowserRouter (data mode: enables useBlocker in the Builder and lazy routes). */
export const routes = [
  // Public: the landing shows the product before any sign-in (ADR-0022).
  { path: '/', element: <LandingPage />, errorElement: <RouteErrorPage standalone /> },
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorPage standalone /> },
  { path: '/logout', element: <LogoutPage />, errorElement: <RouteErrorPage standalone /> },
  // Public: Google's return (ADR-0023) and the privacy notice, which must be readable before having an account.
  { path: '/auth/google', element: <GoogleReturnPage />, errorElement: <RouteErrorPage standalone /> },
  {
    path: '/privacy',
    lazy: page(() => import('./features/legal/PrivacyPage'), 'PrivacyPage'),
    errorElement: <RouteErrorPage standalone />
  },
  // The notice's first URL, still registered in Google's consent screen and in links already shared.
  { path: '/privacidad', element: <Navigate to="/privacy" replace /> },
  {
    element: <RequireAuth><AppShell /></RequireAuth>,
    errorElement: <RouteErrorPage standalone />,
    children: [
      {
        // A page that fails (render or chunk download) keeps the shell: the header still switches tabs.
        errorElement: <RouteErrorPage />,
        children: [
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
