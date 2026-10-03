import { useShowcase } from '../../shared/api/queries';
import { ActionPalette } from '../../shared/ui/ActionPalette';
import { ErrorBox, Loading } from '../../shared/ui/Feedback';
import { HandGrid } from '../../shared/ui/HandGrid';
import { theme } from '../../shared/theme/theme';

const SPOT = { situation: 'btn_open', stack: 25 };

/**
 * One reference chart as the Explorer shows it, read-only, from the ranges bundled with the web (no account, no API):
 * the product at a glance, on the landing page and beside the sign-in. Props: caption, testId
 */
export function ShowcaseChart({ caption = 'Live, from the reference chart', testId }) {
  const showcase = useShowcase();
  const situation = showcase.data?.situations.find(s => s.key === SPOT.situation);
  const hands = showcase.data?.ranges[`${SPOT.situation}@${SPOT.stack}`];
  return (
    <figure style={{ margin: 0, padding: theme.space.lg, display: 'flex', flexDirection: 'column', gap: theme.space.md, minWidth: 0,
      background: theme.colors.bgElevated, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.lg,
      boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)' }} data-testid={testId}>
      <figcaption style={{ display: 'flex', justifyContent: 'space-between', gap: theme.space.sm, flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: theme.font.display, fontSize: 24, fontWeight: 400, letterSpacing: 1 }}>
          {situation ? `${situation.label} · ${SPOT.stack} BB` : 'Reference chart'}
        </strong>
        <small style={{ color: theme.colors.textMuted }}>{caption}</small>
      </figcaption>
      {showcase.isLoading ? <Loading /> : showcase.error ? <ErrorBox error={showcase.error} onRetry={showcase.refetch} /> : (
        <>
          <HandGrid assignments={hands} actions={situation.actions} label={`Range ${situation.label} · ${SPOT.stack} BB`} />
          <ActionPalette actions={situation.actions} />
        </>
      )}
    </figure>
  );
}
