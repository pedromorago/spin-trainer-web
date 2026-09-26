import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { bySituation, dailySeries, hardHands, mostFailed, totals } from '../../domain/stats';
import { useHandStats, useProgress } from '../../shared/api/queries';
import { useSession } from '../../shared/session/useSession';
import { ConfirmBar, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { ProgressChart } from '../../shared/ui/ProgressChart';
import { SituationChips } from '../../shared/ui/SituationChips';
import { StatTile } from '../../shared/ui/StatTile';
import { layout } from '../../shared/ui/styles';
import { theme } from '../../shared/theme/theme';

const pct = x => (x === null ? '—' : `${Math.round(x * 100)} %`);
const RANGES = [7, 30, 90];
// Browser time zone: progress days are cut where the user lives.
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const todayIn = tz => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/**
 * Stats: the current session (local, can be reset) and the historical progress (attempts persisted in the API,
 * aggregated by /stats/hands and /stats/progress; the study policy lives in domain/stats.js).
 */
export function StatsPage() {
  const { situations, selection } = useOutletContext();
  const { session, accuracy, reset } = useSession();
  const handStats = useHandStats();
  const [days, setDays] = useState(30);
  const progress = useProgress({ days, tz: TZ });
  const [confirmReset, setConfirmReset] = useState(false);

  const rows = handStats.data ?? [];
  const global = totals(rows);
  const hard = hardHands(rows);
  const failed = mostFailed(rows, 10);
  const label = key => situations.find(s => s.key === key)?.label ?? key;
  const section = { display: 'flex', flexDirection: 'column', gap: theme.space.md };
  const h3 = { margin: 0, fontFamily: theme.font.display, fontWeight: 400, fontSize: 24, letterSpacing: 1 };
  const kpis = { display: 'flex', gap: theme.space.md, flexWrap: 'wrap' };
  const td = { padding: `${theme.space.xs} ${theme.space.md} ${theme.space.xs} 0`, borderBottom: `1px solid ${theme.colors.borderSubtle}`, textAlign: 'left' };

  return (
    <div style={layout.page}>
      <h2 style={layout.title}>Stats</h2>

      <section aria-labelledby="stats-session" style={section}>
        <div style={{ ...layout.row, justifyContent: 'space-between' }}>
          <h3 id="stats-session" style={h3}>Sesión</h3>
          <button type="button" style={layout.secondary} onClick={() => setConfirmReset(true)} disabled={session.total === 0}
            data-testid="stats-reset-session">Reiniciar sesión</button>
        </div>
        {confirmReset && (
          <ConfirmBar testId="stats-reset-confirm" confirmLabel="Reiniciar"
            message="¿Reiniciar el marcador de la sesión? Tus intentos guardados no se borran."
            onConfirm={() => { reset(); setConfirmReset(false); }} onCancel={() => setConfirmReset(false)} />
        )}
        <div style={kpis}>
          <StatTile label="Precisión de la sesión" value={pct(accuracy)} testId="stats-session-accuracy" />
          <StatTile label="Mejor racha" value={session.bestStreak} hint={`Racha actual: ${session.streak}`} testId="stats-best-streak" />
          <StatTile label="Manos en la sesión" value={session.total} testId="stats-session-total" />
        </div>
      </section>

      <section aria-labelledby="stats-history" style={section}>
        <h3 id="stats-history" style={h3}>Histórico</h3>
        {handStats.isLoading ? <Loading /> : handStats.error ? <ErrorBox error={handStats.error} /> : (
          <>
            <div style={kpis}>
              <StatTile label="Precisión global" value={pct(global.accuracy)} testId="stats-global-accuracy" />
              <StatTile label="Manos jugadas" value={global.attempts} testId="stats-global-total" />
              <StatTile label="Manos difíciles" value={hard.length} hint="≥ 2 fallos y aún sin aprender" testId="stats-hard-count" />
            </div>

            <div style={{ ...section, gap: theme.space.sm }}>
              {/* Period filter: a row above what it narrows down (only the progress chart). */}
              <div style={{ ...layout.row, gap: theme.space.sm }}>
                <strong>Progreso</strong>
                <div role="group" aria-label="Periodo" style={{ display: 'flex', gap: theme.space.xs }}>
                  {RANGES.map(r => (
                    <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)} data-testid={`progress-range-${r}`}
                      style={{ ...layout.secondary, padding: `2px ${theme.space.md}`,
                        background: days === r ? theme.colors.accentSoft : 'transparent', borderColor: days === r ? theme.colors.accent : theme.colors.border }}>
                      {r} días
                    </button>
                  ))}
                </div>
              </div>
              {progress.isLoading ? <Loading /> : progress.error ? <ErrorBox error={progress.error} /> : (
                <ProgressChart series={dailySeries(progress.data, { days, today: todayIn(TZ) })} stale={progress.isPlaceholderData} />
              )}
            </div>

            <div style={{ ...section, gap: theme.space.sm }}>
              <strong>Precisión por situación</strong>
              <SituationChips situations={situations} stats={bySituation(rows)} selectedKey={selection.situationKey} />
            </div>

            <div style={{ ...section, gap: theme.space.sm }}>
              <strong>Manos que más fallas</strong>
              {failed.length === 0 ? (
                <small style={{ color: theme.colors.textMuted }} data-testid="stats-weakest">Sin fallos todavía.</small>
              ) : (
                <table style={{ borderCollapse: 'collapse', fontSize: theme.font.sizeSm, fontVariantNumeric: 'tabular-nums' }} data-testid="stats-weakest">
                  <thead>
                    <tr>{['#', 'Mano', 'Situación', 'Stack', 'Fallos', 'Precisión'].map(h => <th key={h} style={td}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {failed.map((r, i) => (
                      <tr key={`${r.situation}@${r.stack}@${r.hand}`}>
                        <td style={{ ...td, color: theme.colors.textMuted }}>{i + 1}</td>
                        <td style={{ ...td, fontFamily: theme.font.mono, fontWeight: 700 }}>{r.hand}</td>
                        <td style={td}>{label(r.situation)}</td>
                        <td style={td}>{r.stack} BB</td>
                        <td style={td}>{r.fails}/{r.attempts}</td>
                        <td style={td}>{pct(r.accuracy)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
