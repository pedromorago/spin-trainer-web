import { ConfirmBar } from './Feedback';

/** Inline confirmation when useUnsavedChanges blocks a navigation. Props: blocker, testId */
export function UnsavedChangesBar({ blocker, testId = 'unsaved' }) {
  if (blocker.state !== 'blocked') return null;
  return (
    <ConfirmBar testId={testId} message="Tienes cambios sin guardar." confirmLabel="Descartar cambios"
      cancelLabel="Seguir editando" onConfirm={() => blocker.proceed()} onCancel={() => blocker.reset()} />
  );
}
