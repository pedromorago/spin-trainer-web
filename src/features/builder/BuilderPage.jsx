import { useCallback, useMemo, useState } from 'react';
import { useBeforeUnload, useBlocker, useOutletContext } from 'react-router';
import { evaluateRange, explicitHands, normalizeRange, summarize } from '../../domain/range';
import { ACTION_LABELS } from '../../domain/actions';
import { comboKey } from '../../domain/selection';
import { useDefaultRange, useDeleteUserRange, useSaveUserRange, useUserRange } from '../../shared/api/queries';
import { HandGrid } from '../../shared/ui/HandGrid';
import { ActionPalette } from '../../shared/ui/ActionPalette';
import { ComboPicker } from '../../shared/ui/ComboPicker';
import { ConfirmBar, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { layout } from '../../shared/ui/styles';
import { theme } from '../../shared/theme/theme';

const NO_HANDS = Object.freeze({});

export function BuilderPage() {
  const { situations, selection } = useOutletContext();
  const [pickedAction, setPickedAction] = useState(null);

  return (
    <div style={layout.page}>
      <h2 style={layout.title}>Builder</h2>
      {/* La key reinicia la elección de combinación al cambiar la selección. */}
      <ComboPicker key={`${selection.situationKey}@${selection.stack}`}
        situations={situations} combos={selection.combos} random={selection.isAny}>
        {(combo, situation) => (
          <BuilderCombo key={comboKey(combo)} situation={situation} stack={combo.stack}
            pickedAction={pickedAction} onPickAction={setPickedAction} />
        )}
      </ComboPicker>
    </div>
  );
}

function BuilderCombo({ situation, stack, pickedAction, onPickAction }) {
  const def = useDefaultRange(situation.key, stack);
  const userRange = useUserRange(situation.key, stack);
  // Acción de pincel derivada: se conserva entre situaciones si sigue siendo válida.
  const paintAction = situation.actions.includes(pickedAction) ? pickedAction : situation.actions[0];

  return (
    <>
      <ActionPalette actions={situation.actions} selected={paintAction} onSelect={onPickAction} />
      <ErrorBox error={userRange.error} />
      {userRange.isLoading ? <Loading /> : (
        <RangeEditor situation={situation} stack={stack} saved={userRange.data} target={def.data?.hands ?? {}}
          paintAction={paintAction} onReload={() => userRange.refetch()} />
      )}
    </>
  );
}

function RangeEditor({ situation, stack, saved, target, paintAction, onReload }) {
  const save = useSaveUserRange(situation.key, stack);
  const remove = useDeleteUserRange(situation.key, stack);
  // Borrador solo mientras hay cambios sin guardar. Recuerda la versión sobre la que se empezó a editar:
  // un refetch en segundo plano no pisa el borrador y el PUT sigue detectando el conflicto (409).
  const [pending, setPending] = useState(null); // { hands, baseVersion } | null
  const [evaluation, setEvaluation] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = pending !== null;
  const hands = pending?.hands ?? saved?.hands ?? NO_HANDS;

  // Cambios sin guardar: bloquea navegación interna (incluido cambiar situación/stack, que vive en la URL) y cierre de pestaña.
  const blocker = useBlocker(({ currentLocation: a, nextLocation: b }) => dirty && (a.pathname !== b.pathname || a.search !== b.search));
  useBeforeUnload(useCallback(e => { if (dirty) e.preventDefault(); }, [dirty]));

  const edit = next => {
    setPending(p => ({ hands: next, baseVersion: p ? p.baseVersion : saved?.version }));
    setEvaluation(null);
  };
  const paint = hand => {
    const next = { ...hands };
    if (next[hand] === paintAction) delete next[hand]; else next[hand] = paintAction;
    edit(next);
  };
  const persist = () => save.mutate(
    { hands: normalizeRange(hands, situation.actions), version: pending.baseVersion },
    { onSuccess: () => setPending(null) }
  );
  const discardAndReload = () => { setPending(null); save.reset(); onReload(); };
  const deleteSaved = () => {
    setConfirmDelete(false);
    remove.mutate(undefined, { onSuccess: () => { setPending(null); setEvaluation(null); } });
  };

  const summary = useMemo(() => summarize(hands, situation.actions), [hands, situation.actions]);
  const canCompare = explicitHands(target, situation.actions).length > 0;
  const busy = save.isPending || remove.isPending;

  return (
    <>
      {blocker.state === 'blocked' && (
        <ConfirmBar testId="builder-unsaved" message="Tienes cambios sin guardar." confirmLabel="Descartar cambios"
          cancelLabel="Seguir editando" onConfirm={() => blocker.proceed()} onCancel={() => blocker.reset()} />
      )}
      <ErrorBox error={save.error ?? remove.error} />
      {save.error?.isConflict && (
        <button style={{ ...layout.secondary, alignSelf: 'flex-start' }} onClick={discardAndReload} data-testid="builder-reload">
          Descartar mis cambios y cargar la versión guardada
        </button>
      )}
      <HandGrid assignments={hands} actions={situation.actions} onCellClick={paint} verdicts={evaluation?.verdicts} />
      <div style={layout.mono} data-testid="builder-summary">
        {Object.entries(summary).map(([a, s]) => `${ACTION_LABELS[a] ?? a}: ${s.hands}`).join(' · ')}
        {saved && ` · guardado v${saved.version}`}{dirty && ' · sin guardar'}
      </div>
      <div style={layout.row}>
        <button style={layout.primary} onClick={persist} disabled={!dirty || busy} data-testid="builder-save">
          {save.isPending ? 'Guardando…' : 'Guardar rango'}
        </button>
        <button style={layout.secondary} onClick={() => setEvaluation(evaluateRange(target, hands, situation.actions))}
          disabled={!canCompare} data-testid="builder-evaluate"
          title={canCompare ? '' : 'Sin rango default cargado para comparar'}>Comparar con el rango correcto</button>
        <button style={layout.secondary} onClick={() => edit({})} data-testid="builder-clear">Limpiar</button>
        {saved && (
          <button style={layout.secondary} onClick={() => setConfirmDelete(true)} disabled={busy} data-testid="builder-delete">
            Borrar rango guardado
          </button>
        )}
      </div>
      {confirmDelete && (
        <ConfirmBar testId="builder-delete-confirm" message="¿Borrar tu rango guardado para esta situación y stack?"
          confirmLabel="Borrar" onConfirm={deleteSaved} onCancel={() => setConfirmDelete(false)} />
      )}
      {evaluation && (
        <div data-testid="builder-evaluation" style={{ padding: theme.space.md, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm }}>
          <strong>{evaluation.correct} / {evaluation.total}</strong> manos correctas ({Math.round(evaluation.accuracy * 100)}%)
          <div style={layout.mono}>
            {Object.entries(evaluation.byAction).map(([a, s]) => `${ACTION_LABELS[a] ?? a}: ${s.correct}/${s.total}`).join(' · ')}
          </div>
        </div>
      )}
    </>
  );
}
