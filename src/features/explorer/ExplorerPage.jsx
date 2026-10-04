import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router';
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
import { useAuth } from '../../shared/auth/useAuth';
import { markTourSeen, tourSeen } from '../../shared/ui/onboarding';
import { Tour } from '../../shared/ui/Tour';
import { explorerTour } from './explorerTour';

const NO_HANDS = Object.freeze({});

export function ExplorerPage() {
  const { selection } = useOutletContext();
  const { demo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // The tour opens once per browser on the first visit, and again whenever the header's Tour button asks for it.
  const [firstVisit, setFirstVisit] = useState(() => !tourSeen());
  const replay = location.state?.tour === true;
  const here = { pathname: location.pathname, search: location.search };
  const endTour = outcome => {
    markTourSeen(outcome);
    setFirstVisit(false);
    if (replay) navigate(here, { replace: true, state: null });
  };

  return (
    <div style={layout.page}>
      {(firstVisit || replay) && (
        <Tour steps={explorerTour({ demo, onTryQuiz: () => navigate({ pathname: '/quiz', search: location.search }) })}
          onClose={endTour} />
      )}
      <h2 style={layout.title}>Explorer</h2>
      {selection.isAny ? (
        <Empty>
          <span data-testid="explorer-random">
            Random mode: the Explorer shows one situation and one stack. Quiz and Builder will pick spots at random.
          </span>
        </Empty>
      ) : (
        // The key resets the editor when the situation/stack changes (no setState in effects).
        <RangeWorkbench key={`${selection.situationKey}@${selection.stack}`} situation={selection.situation} stack={selection.stack} />
      )}
    </div>
  );
}

function RangeWorkbench({ situation, stack }) {
  const effective = useEffectiveRange(situation.key, stack);
  if (effective.isLoading) return <Loading />;
  // Also when only the custom ranges fail: showing the PDF one instead would hide the user's range (and saving over
  // it with version 0 would end in a conflict).
  if (effective.error) return <ErrorBox error={effective.error} onRetry={effective.refetch} />;
  return (
    <RangeEditor situation={situation} stack={stack} saved={effective.userRange} reference={effective.defaultRange}
      onReload={effective.refetchUserRange} />
  );
}

/**
 * The effective range (ADR-0012): custom if it exists, otherwise the PDF one. Read-only until Edit: then the grid can be
 * painted, Save creates or replaces the custom range (PUT with the version editing started from; with nothing changed it
 * just goes back to reading), Cancel leaves without saving and Reset deletes the custom range. Saving or resetting
 * confirms it and goes back to reading.
 */
function RangeEditor({ situation, stack, saved, reference, onReload }) {
  const save = useSaveUserRange(situation.key, stack);
  const remove = useDeleteUserRange(situation.key, stack);
  const [editing, setEditing] = useState(false);
  const [brush, setBrush] = useState(situation.actions[0]);
  // Draft only while there are changes; remembers the starting version to detect conflicts (409).
  const [pending, setPending] = useState(null);
  const [confirm, setConfirm] = useState(null); // 'reset' | 'cancel' | null
  const [notice, setNotice] = useState(null); // what the last Save or Reset did
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
    // While saving or deleting the grid is frozen: the save's success clears the draft, and it would take these edits.
    if (busy) return;
    setPending(p => {
      const current = p?.hands ?? base;
      const next = paintHand(current, hand, brush, actions);
      // version 0 = create; N = replace version N (contract v0.2).
      return next === current ? p : { hands: next, baseVersion: p ? p.baseVersion : saved?.version ?? 0 };
    });
  };
  const startEditing = () => { setEditing(true); setNotice(null); setCopyStatus(null); };
  const stopEditing = done => { setPending(null); setConfirm(null); setEditing(false); setNotice(done); };
  const persist = () => (modified
    ? save.mutate({ hands: normalizeRange(hands, actions), version: pending.baseVersion }, { onSuccess: () => stopEditing('Saved') })
    : stopEditing(null));
  const cancel = () => (modified ? setConfirm('cancel') : stopEditing(null));
  const reset = () => {
    setConfirm(null);
    remove.mutate(undefined, { onSuccess: () => stopEditing(hasReference ? 'Back to the PDF range' : 'Custom range deleted') });
  };
  const discardAndReload = () => { stopEditing(null); save.reset(); onReload(); };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportRange(hands, actions, { title: `${situation.label} · ${stack} BB` }));
      setCopyStatus('Copied to the clipboard');
    } catch {
      setCopyStatus('Could not copy: the browser denied access to the clipboard');
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
          {editing ? (
            <>
              <button type="button" style={layout.primary} onClick={persist} disabled={busy} data-testid="explorer-save">
                {save.isPending ? 'Saving…' : 'Save'}
              </button>
              <button type="button" style={layout.secondary} onClick={cancel} disabled={busy} data-testid="explorer-cancel">Cancel</button>
              <button type="button" style={layout.secondary} onClick={() => setConfirm('reset')} disabled={!saved || busy}
                data-testid="explorer-reset">Reset</button>
            </>
          ) : (
            <>
              <button type="button" style={layout.primary} onClick={startEditing} data-testid="explorer-edit">Edit</button>
              <button type="button" style={layout.secondary} onClick={copy} data-testid="explorer-copy">Copy</button>
            </>
          )}
          <span style={{ display: 'flex', gap: theme.space.xs, marginLeft: theme.space.sm }}>
            {editing && badge('Editing', theme.colors.accent, 'badge-editing')}
            {modified && badge('Modified', theme.colors.accentStrong, 'badge-modified')}
            {saved && badge('Custom', theme.colors.success, 'badge-custom')}
            {!saved && hasReference && badge('PDF', theme.colors.textMuted, 'badge-reference')}
          </span>
          <small role="status" style={{ color: theme.colors.success, fontWeight: 600 }} data-testid="explorer-notice">
            {notice && `✓ ${notice}`}
          </small>
          <small role="status" style={{ color: theme.colors.textMuted }} data-testid="explorer-copy-status">{copyStatus}</small>
        </div>
        {confirm === 'reset' && (
          <ConfirmBar testId="explorer-reset-confirm"
            message={hasReference ? 'Delete your custom range and go back to the PDF one?' : 'Delete your custom range?'}
            confirmLabel={hasReference ? 'Delete and go back to the PDF' : 'Delete'} onConfirm={reset} onCancel={() => setConfirm(null)} />
        )}
        {confirm === 'cancel' && (
          <ConfirmBar testId="explorer-cancel-confirm" message="Discard your changes?" confirmLabel="Discard changes"
            cancelLabel="Keep editing" onConfirm={() => stopEditing(null)} onCancel={() => setConfirm(null)} />
        )}
        <ErrorBox error={save.error ?? remove.error} />
        {save.error?.isConflict && (
          <button type="button" style={{ ...layout.secondary, alignSelf: 'flex-start' }} onClick={discardAndReload} data-testid="explorer-reload">
            Discard my changes and load the saved version
          </button>
        )}
        {!saved && !hasReference && (
          <small style={{ color: theme.colors.textMuted }} data-testid="explorer-no-reference">
            No PDF range for this spot yet: press Edit to paint and save your own.
          </small>
        )}
        {editing
          ? <ActionPalette actions={actions} selected={brush} onSelect={setBrush} eraser />
          : <ActionPalette actions={actions} />}
        <HandGrid assignments={hands} actions={actions} onPaint={editing ? paint : undefined}
          label={`Range ${situation.label} · ${stack} BB`} />
      </div>
      <RangePanel stats={stats} notes={situation.notes} />
    </div>
  );
}
