import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { theme } from '../../shared/theme/theme';
import { layout } from '../../shared/ui/styles';

// A failed dynamic import is worded differently by Chromium, Firefox and Safari.
const CHUNK_LOAD_FAILED = /dynamically imported module|importing a module script failed|failed to fetch/i;

/**
 * Route errorElement: replaces React Router's default screen (in English and with no way out) when a page throws
 * while rendering or its chunk cannot be downloaded (typically after a deploy, or offline).
 * Inside the shell it keeps the header, so the other tabs stay reachable; `standalone` renders its own <main>.
 */
export function RouteErrorPage({ standalone = false }) {
  const error = useRouteError();
  const chunkFailed = CHUNK_LOAD_FAILED.test(error?.message ?? '');

  // The screen shows no technical details: those go to the console for developers.
  useEffect(() => console.error(error), [error]);

  const Title = standalone ? 'h1' : 'h2';
  const content = (
    <section aria-labelledby="route-error-title" data-testid="route-error" style={layout.page}>
      <Title id="route-error-title" style={layout.title}>No se ha podido mostrar esta pantalla</Title>
      <p role="alert" style={{ margin: 0, color: theme.colors.textMuted }}>
        {chunkFailed
          ? 'No se pudo descargar: puede que haya una versión nueva de la aplicación o que se haya perdido la conexión.'
          : 'Se ha producido un error inesperado.'} Recarga la página para intentarlo de nuevo.
      </p>
      <div style={layout.row}>
        <button type="button" style={layout.primary} onClick={() => window.location.reload()}>Recargar</button>
        <a href="/" style={{ ...layout.secondary, textDecoration: 'none' }}>Ir al inicio</a>
      </div>
    </section>
  );

  return standalone
    ? <main style={{ maxWidth: 720, margin: '0 auto', padding: theme.space.xl }}>{content}</main>
    : content;
}
