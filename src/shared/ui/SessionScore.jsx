import { theme } from '../theme/theme';

/** Session scoreboard: accuracy, streak and hands. Props: accuracy (0..1 | null), streak, total */
export function SessionScore({ accuracy = null, streak = 0, total = 0 }) {
  const items = [
    ['Accuracy', accuracy === null ? '—' : `${Math.round(accuracy * 100)}%`, 'session-accuracy'],
    ['Streak', streak, 'session-streak'],
    ['Hands', total, 'session-total']
  ];
  return (
    <dl aria-label="Session" data-tour="score" style={{ display: 'flex', gap: theme.space.lg, margin: 0 }}>
      {items.map(([label, value, testId]) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
          <dt style={{ fontFamily: theme.font.display, fontSize: 13, letterSpacing: 1, color: theme.colors.textMuted }}>{label}</dt>
          <dd style={{ margin: 0, fontFamily: theme.font.mono, fontSize: 18, fontWeight: 700, color: theme.colors.accentStrong }}
            data-testid={testId}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
