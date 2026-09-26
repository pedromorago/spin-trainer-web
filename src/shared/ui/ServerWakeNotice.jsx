import { theme } from '../theme/theme';

/**
 * Live region that tells the player the server is waking up (free instance, ADR-0018). Always in the DOM so screen
 * readers announce the text when it appears.
 */
export function ServerWakeNotice({ visible }) {
  return (
    <p role="status" aria-live="polite" data-testid="server-waking"
      style={{ margin: 0, color: theme.colors.textMuted, fontSize: theme.font.sizeSm }}>
      {visible ? 'Despertando el servidor: tras un rato sin uso, la primera carga puede tardar hasta un minuto.' : ''}
    </p>
  );
}
