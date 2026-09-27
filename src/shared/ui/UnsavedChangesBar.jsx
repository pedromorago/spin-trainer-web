import { ConfirmBar } from './Feedback';

/** Inline confirmation when useUnsavedChanges blocks a navigation. Props: blocker, testId */
export function UnsavedChangesBar({ blocker, testId = 'unsaved' }) {
  if (blocker.state !== 'blocked') return null;
  return (
    <ConfirmBar testId={testId} message="You have unsaved changes." confirmLabel="Discard changes"
      cancelLabel="Keep editing" onConfirm={() => blocker.proceed()} onCancel={() => blocker.reset()} />
  );
}
