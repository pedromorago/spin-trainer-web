import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { routes } from './App';
import { UserScope } from './UserScope';
import { AuthProvider } from './shared/auth/AuthProvider';
import '@fontsource/bebas-neue/400.css';
import '@fontsource-variable/dm-sans/index.css';
import '@fontsource-variable/jetbrains-mono/index.css';
import './shared/theme/global.css';

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <UserScope>
        <RouterProvider router={router} />
      </UserScope>
    </AuthProvider>
  </StrictMode>
);
