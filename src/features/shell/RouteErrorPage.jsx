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
      <Title id="route-error-title" style={layout.title}>This screen could not be shown</Title>
      <p role="alert" style={{ margin: 0, color: theme.colors.textMuted }}>
        {chunkFailed
          ? 'It could not be downloaded: there may be a new version of the app, or the connection was lost.'
          : 'Something unexpected went wrong.'} Reload the page to try again.
      </p>
      <div style={layout.row}>
        <button type="button" style={layout.primary} onClick={() => window.location.reload()}>Reload</button>
        <a href="/" style={{ ...layout.secondary, textDecoration: 'none' }}>Go to start</a>
      </div>
    </section>
  );

  return standalone
    ? <main style={{ maxWidth: 720, margin: '0 auto', padding: theme.space.xl }}>{content}</main>
    : content;
}
