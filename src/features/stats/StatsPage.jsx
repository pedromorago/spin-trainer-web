import { useOutletContext } from 'react-router';
import { bySituationStack, mostFailed, totals } from '../../domain/stats';
import { useHandStats } from '../../shared/api/queries';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { layout } from '../../shared/ui/styles';
import { theme } from '../../shared/theme/theme';

const pct = x => `${Math.round(x * 100)}%`;

/** Progreso histórico sobre los agregados de GET /stats/hands (la política de estudio vive en domain/stats.js). */
export function StatsPage() {
  const { situations } = useOutletContext();
  const handStats = useHandStats();

  if (handStats.isLoading) return <Loading />;
  if (handStats.error) return <ErrorBox error={handStats.error} />;
  const rows = handStats.data ?? [];
  if (rows.length === 0) return <Empty>Todavía no hay intentos. Juega unas manos en el Quiz.</Empty>;

  const label = key => situations.find(s => s.key === key)?.label ?? key;
  const global = totals(rows);
  const table = { borderCollapse: 'collapse', fontSize: theme.font.sizeSm };
  const td = { padding: `${theme.space.xs} ${theme.space.md}`, borderBottom: `1px solid ${theme.colors.borderSubtle}`, textAlign: 'left' };

  return (
    <div style={layout.page}>
      <h2 style={layout.title}>Stats</h2>
      <div data-testid="stats-global">
        <strong>{pct(global.accuracy)}</strong> de acierto en {global.attempts} intentos
      </div>
      <table style={table} data-testid="stats-by-situation">
        <thead><tr><th style={td}>Situación</th><th style={td}>Stack</th><th style={td}>Intentos</th><th style={td}>Acierto</th></tr></thead>
        <tbody>
          {Object.entries(bySituationStack(rows)).map(([k, v]) => {
            const [sit, stack] = k.split('@');
            return <tr key={k}><td style={td}>{label(sit)}</td><td style={td}>{stack} BB</td><td style={td}>{v.attempts}</td><td style={td}>{pct(v.accuracy)}</td></tr>;
          })}
        </tbody>
      </table>
      <div>
        <h3 style={{ margin: `0 0 ${theme.space.sm}` }}>Manos que más fallas</h3>
        <div style={layout.mono} data-testid="stats-weakest">
          {mostFailed(rows).map(r => `${r.hand} (${label(r.situation)} ${r.stack} BB) ${r.fails}✗/${r.attempts}`).join(' · ') || 'Sin fallos todavía'}
        </div>
      </div>
    </div>
  );
}
