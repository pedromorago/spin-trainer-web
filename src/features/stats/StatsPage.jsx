import { accuracy, bySituationStack, weakestHands } from '../../domain/stats';
import { useAttempts, useSituations } from '../../shared/api/queries';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { layout } from '../../shared/ui/styles';
import { theme } from '../../shared/theme/theme';

export function StatsPage() {
  const attempts = useAttempts();
  const situations = useSituations();

  if (attempts.isLoading || situations.isLoading) return <Loading />;
  if (attempts.error) return <ErrorBox error={attempts.error} />;
  const data = attempts.data ?? [];
  if (data.length === 0) return <Empty>Todavía no hay intentos. Juega unas manos en el Quiz.</Empty>;

  const label = key => situations.data?.find(s => s.key === key)?.label ?? key;
  const table = { borderCollapse: 'collapse', fontSize: theme.font.sizeSm };
  const td = { padding: `${theme.space.xs} ${theme.space.md}`, borderBottom: `1px solid ${theme.colors.borderSubtle}`, textAlign: 'left' };

  return (
    <div style={layout.page}>
      <h2 style={{ margin: 0 }}>Stats</h2>
      <div data-testid="stats-global">
        <strong>{Math.round(accuracy(data) * 100)}%</strong> de acierto en {data.length} intentos
      </div>
      <table style={table} data-testid="stats-by-situation">
        <thead><tr><th style={td}>Situación</th><th style={td}>Stack</th><th style={td}>Intentos</th><th style={td}>Acierto</th></tr></thead>
        <tbody>
          {Object.entries(bySituationStack(data)).map(([k, v]) => {
            const [sit, stack] = k.split('@');
            return <tr key={k}><td style={td}>{label(sit)}</td><td style={td}>{stack} BB</td><td style={td}>{v.total}</td><td style={td}>{Math.round(v.accuracy * 100)}%</td></tr>;
          })}
        </tbody>
      </table>
      <div>
        <h3 style={{ margin: `0 0 ${theme.space.sm}` }}>Manos que más fallas</h3>
        <div style={layout.mono} data-testid="stats-weakest">
          {weakestHands(data).map(w => `${w.hand} ${Math.round(w.accuracy * 100)}% (${w.total})`).join(' · ') || 'Aún sin datos suficientes'}
        </div>
      </div>
    </div>
  );
}
