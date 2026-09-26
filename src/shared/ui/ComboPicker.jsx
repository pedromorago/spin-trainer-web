import { useState } from 'react';
import { pickCombo } from '../../domain/selection';
import { Empty } from './Feedback';
import { layout } from './styles';
import { theme } from '../theme/theme';

/**
 * Resuelve la combinación (situación, stack) con la que trabaja una pestaña.
 * Con una selección concreta es esa; con "Any" elige una al azar y permite pedir otra.
 * Montar con key = selección para reiniciar la elección al cambiarla.
 * Props: situations, combos, random, children(combo, situation)
 */
export function ComboPicker({ situations, combos, random, children }) {
  const [combo, setCombo] = useState(() => (random ? pickCombo(combos) : combos[0] ?? null));
  if (!combo) return <Empty>No hay combinaciones para esta selección.</Empty>;
  const situation = situations.find(s => s.key === combo.situation);

  return (
    <>
      {random && (
        <div style={{ ...layout.row, gap: theme.space.md }} data-testid="combo-picker">
          <span style={{ color: theme.colors.textMuted }}>
            Al azar: <strong style={{ color: theme.colors.text }} data-testid="combo-current">{situation.label} · {combo.stack} BB</strong>
          </span>
          <button type="button" style={layout.secondary} onClick={() => setCombo(c => pickCombo(combos, Math.random, c))}
            data-testid="combo-reroll">Otra combinación</button>
        </div>
      )}
      {children(combo, situation)}
    </>
  );
}
