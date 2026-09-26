import { ConfirmBar } from './Feedback';

/** Confirmación en línea cuando useUnsavedChanges bloquea una navegación. Props: blocker, testId */
export function UnsavedChangesBar({ blocker, testId = 'unsaved' }) {
  if (blocker.state !== 'blocked') return null;
  return (
    <ConfirmBar testId={testId} message="Tienes cambios sin guardar." confirmLabel="Descartar cambios"
      cancelLabel="Seguir editando" onConfirm={() => blocker.proceed()} onCancel={() => blocker.reset()} />
  );
}
