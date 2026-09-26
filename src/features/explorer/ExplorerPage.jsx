import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { exportRange, normalizeRange, paintHand, rangesEqual, rangeStats } from '../../domain/range';
import { useDeleteUserRange, useEffectiveRange, useSaveUserRange } from '../../shared/api/queries';
import { HandGrid } from '../../shared/ui/HandGrid';
import { ActionPalette } from '../../shared/ui/ActionPalette';
import { RangePanel } from '../../shared/ui/RangePanel';
import { ConfirmBar, Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { UnsavedChangesBar } from '../../shared/ui/UnsavedChangesBar';
import { useUnsavedChanges } from '../../shared/ui/useUnsavedChanges';
import { layout } from '../../shared/ui/styles';
import { theme } from '../../shared/theme/theme';

const NO_HANDS = Object.freeze({});

export function ExplorerPage() {
  const { selection } = useOutletContext();

  return (
    <div style={layout.page}>
      <h2 style={layout.title}>Explorer</h2>
      {selection.isAny ? (
        <Empty>
          <span data-testid="explorer-random">
            Modo aleatorio: el Explorer muestra una situación y un stack concretos. Quiz y Builder elegirán combinaciones al azar.
          </span>
        </Empty>
      ) : (
        // La key reinicia el editor al cambiar de situación/stack (sin setState en efectos).
        <RangeWorkbench key={`${selection.situationKey}@${selection.stack}`} situation={selection.situation} stack={selection.stack} />
      )}
    </div>
  );
}

function RangeWorkbench({ situation, stack }) {
  const effective = useEffectiveRange(situation.key, stack);
  if (effective.isLoading) return <Loading />;
  if (!effective.range && effective.error) return <ErrorBox error={effective.error} />;
  return (
    <RangeEditor situation={situation} stack={stack} saved={effective.userRange} reference={effective.defaultRange}
      onReload={effective.refetchUserRange} />
  );
}

/**
 * Editor del rango efectivo (ADR-0012): custom si existe, si no el del PDF.
 * Guardar crea/reemplaza el custom (PUT con la versión sobre la que se empezó a editar); Reset lo borra.
 */
function RangeEditor({ situation, stack, saved, reference, onReload }) {
  const save = useSaveUserRange(situation.key, stack);
  const remove = useDeleteUserRange(situation.key, stack);
  const [brush, setBrush] = useState(situation.actions[0]);
  // Borrador solo mientras hay cambios; recuerda la versión de partida para detectar conflictos (409).
  const [pending, setPending] = useState(null);
  const [confirm, setConfirm] = useState(null); // 'reset' | null
  const [copyStatus, setCopyStatus] = useState(null);

  const actions = situation.actions;
  const hasReference = Object.keys(reference?.hands ?? {}).length > 0;
  const base = saved?.hands ?? reference?.hands ?? NO_HANDS;
  const hands = pending?.hands ?? base;
  const modified = pending !== null && !rangesEqual(pending.hands, base, actions);
  const blocker = useUnsavedChanges(modified);
  const stats = useMemo(() => rangeStats(hands, actions), [hands, actions]);
  const busy = save.isPending || remove.isPending;

  const paint = hand => {
    setCopyStatus(null);
    setPending(p => {
      const current = p?.hands ?? base;
      const next = paintHand(current, hand, brush, actions);
      return next === current ? p : { hands: next, baseVersion: p ? p.baseVersion : saved?.version };
    });
  };
  const persist = () => save.mutate(
    { hands: normalizeRange(hands, actions), version: pending.baseVersion },
    { onSuccess: () => setPending(null) }
  );
  const reset = () => {
    setConfirm(null);
    if (saved) remove.mutate(undefined, { onSuccess: () => setPending(null) });
    else setPending(null);
  };
  const discardAndReload = () => { setPending(null); save.reset(); onReload(); };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportRange(hands, actions, { title: `${situation.label} · ${stack} BB` }));
      setCopyStatus('Copiado al portapapeles');
    } catch {
      setCopyStatus('No se pudo copiar: el navegador no dio acceso al portapapeles');
    }
  };

  const badge = (text, color, testId) => (
    <span data-testid={testId} style={{ padding: `2px ${theme.space.sm}`, borderRadius: theme.radius.pill, fontSize: theme.font.sizeXs,
      fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color, border: `1px solid ${color}` }}>{text}</span>
  );

  return (
    <div style={{ display: 'flex', gap: theme.space.xl, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ ...layout.page, gap: theme.space.md, flex: '1 1 480px', minWidth: 0 }}>
        <UnsavedChangesBar blocker={blocker} testId="explorer-unsaved" />
        <div style={{ ...layout.row, gap: theme.space.sm }}>
          <button type="button" style={layout.primary} onClick={persist} disabled={!modified || busy} data-testid="explorer-save">
            {save.isPending ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" style={layout.secondary} onClick={() => setConfirm('reset')} disabled={(!saved && !modified) || busy}
            data-testid="explorer-reset">Reset</button>
          <button type="button" style={layout.secondary} onClick={copy} data-testid="explorer-copy">Copiar</button>
          <span style={{ display: 'flex', gap: theme.space.xs, marginLeft: theme.space.sm }}>
            {modified && badge('Modificado', theme.colors.accentStrong, 'badge-modified')}
            {saved && badge('Guardado', theme.colors.success, 'badge-saved')}
            {!saved && hasReference && badge('PDF', theme.colors.textMuted, 'badge-reference')}
          </span>
          <small role="status" style={{ color: theme.colors.textMuted }} data-testid="explorer-copy-status">{copyStatus}</small>
        </div>
        {confirm === 'reset' && (
          <ConfirmBar testId="explorer-reset-confirm"
            message={saved ? '¿Borrar tu rango personalizado y volver al del PDF?' : '¿Descartar los cambios sin guardar?'}
            confirmLabel={saved ? 'Borrar y volver al PDF' : 'Descartar'} onConfirm={reset} onCancel={() => setConfirm(null)} />
        )}
        <ErrorBox error={save.error ?? remove.error} />
        {save.error?.isConflict && (
          <button type="button" style={{ ...layout.secondary, alignSelf: 'flex-start' }} onClick={discardAndReload} data-testid="explorer-reload">
            Descartar mis cambios y cargar la versión guardada
          </button>
        )}
        {!saved && !hasReference && (
          <small style={{ color: theme.colors.textMuted }} data-testid="explorer-no-reference">
            Sin rango del PDF para este spot todavía: puedes pintar y guardar el tuyo.
          </small>
        )}
        <ActionPalette actions={actions} selected={brush} onSelect={setBrush} eraser />
        <HandGrid assignments={hands} actions={actions} onPaint={paint} label={`Rango ${situation.label} · ${stack} BB`} />
      </div>
      <RangePanel stats={stats} notes={situation.notes} />
    </div>
  );
}
