import { useEffect, useId, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../shared/auth/useAuth';
import { theme } from '../../shared/theme/theme';
import { SignInCard } from './SignInCard';

/**
 * Signing in without leaving the page (the landing's ways into the app): the sign-in card in a native modal <dialog>,
 * centred, or a bottom sheet on phones (global.css). The browser keeps focus inside it; Escape, the close button or a
 * click outside close it, and focus goes back to what opened it. Once signed in (the mock signs in at once; Google
 * comes back through /auth/google) it goes on to `returnPath`.
 * Props: returnPath (null: closed), onClose
 */
export function SignInDialog({ returnPath, onClose }) {
  const ref = useRef(null);
  const headingId = useId();
  const { user } = useAuth();
  const navigate = useNavigate();
  const open = returnPath != null;

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return undefined;
    const opener = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      opener?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (open && user) navigate(returnPath);
  }, [open, user, returnPath, navigate]);

  return (
    <dialog ref={ref} className="signin-dialog" aria-labelledby={headingId} data-testid="signin-dialog"
      // Escape: React closes it (the effect above), so the state and the dialog never disagree.
      onCancel={event => { event.preventDefault(); onClose(); }}
      // A click on the dialog element itself is a click on its backdrop: the content fills it.
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      {open && (
        <div style={{ position: 'relative', padding: theme.space.xl }}>
          <SignInCard returnPath={returnPath} headingId={headingId} headingLevel={2} />
          <button type="button" onClick={onClose} aria-label="Close"
            style={{ position: 'absolute', top: theme.space.md, right: theme.space.md, width: 36, height: 36, display: 'flex',
              alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: `1px solid ${theme.colors.border}`,
              background: 'transparent', color: theme.colors.textMuted, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>
            ×
          </button>
        </div>
      )}
    </dialog>
  );
}
