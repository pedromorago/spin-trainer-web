import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { placeDialog, SHEET_BREAKPOINT } from './placement';
import { layout } from './styles';
import { theme } from '../theme/theme';

const PAD = 6;
const DIALOG_WIDTH = 380;
const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * Guided tour (ADR-0022): a modal dialog per step, next to the element it explains, which a spotlight cuts out of a
 * dimmed page. Skip on every step and Escape skip it; Back and Next move through it; the last step ends it, optionally
 * with an action (e.g. "Try the Quiz"). Focus stays in the dialog (Tab cycles) and goes back where it was at the end.
 * Placement is imperative (placement.js): measuring and moving the boxes needs no re-render.
 * Props: steps ([{ target?: CSS selector, title, body, action?: { label, onClick } }]), onClose('done' | 'skipped')
 */
export function Tour({ steps, onClose }) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef(null);
  const spotRef = useRef(null);
  const backdropRef = useRef(null);
  const headingRef = useRef(null);
  const titleId = useId();
  const bodyId = useId();
  const step = steps[index];
  const last = index === steps.length - 1;

  // Focus goes back to whatever had it before the tour.
  useEffect(() => {
    const previous = document.activeElement;
    return () => previous?.focus?.();
  }, []);

  // A new step: its target comes into view and focus goes to the step's title (screen readers read the step).
  useLayoutEffect(() => {
    if (step.target) document.querySelector(step.target)?.scrollIntoView({ block: 'center', inline: 'nearest' });
    headingRef.current?.focus();
  }, [index, step.target]);

  // Placement after every render (the page may have just rendered the step's target, e.g. once its data loads) and on
  // every resize, scroll or change in the page's size.
  useLayoutEffect(() => {
    const place = () => {
      const dialog = dialogRef.current;
      const spot = spotRef.current;
      if (!dialog || !spot) return;
      const box = step.target ? document.querySelector(step.target)?.getBoundingClientRect() : null;
      const rect = box && box.width > 0 && box.height > 0 ? box : null;
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      // The spotlight's shadow dims the page; without a target the backdrop does.
      backdropRef.current.style.background = rect ? 'transparent' : 'rgba(5, 7, 10, 0.72)';
      spot.style.display = rect ? 'block' : 'none';
      if (rect) {
        Object.assign(spot.style, { top: `${rect.top - PAD}px`, left: `${rect.left - PAD}px`,
          width: `${rect.width + 2 * PAD}px`, height: `${rect.height + 2 * PAD}px` });
      }
      const sheet = viewport.width < SHEET_BREAKPOINT;
      Object.assign(dialog.style, sheet
        ? { width: 'auto', left: '12px', right: '12px', top: 'auto', bottom: '12px' }
        : { width: `${DIALOG_WIDTH}px`, right: 'auto', bottom: 'auto' });
      const placement = placeDialog(rect && { top: rect.top - PAD, bottom: rect.bottom + PAD, left: rect.left, width: rect.width },
        { width: dialog.offsetWidth, height: dialog.offsetHeight }, viewport);
      if (placement.mode !== 'sheet') Object.assign(dialog.style, { top: `${placement.top}px`, left: `${placement.left}px` });
      dialog.dataset.placement = placement.mode;
    };
    place();
    const resized = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null;
    resized?.observe(document.body);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      resized?.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  });

  const onKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose('skipped');
    } else if (event.key === 'Tab') {
      const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
      const first = focusable[0];
      const lastFocusable = focusable.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === headingRef.current)) {
        event.preventDefault();
        lastFocusable?.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        first?.focus();
      }
    }
  };

  const textButton = { background: 'none', border: 'none', color: theme.colors.textMuted, cursor: 'pointer', padding: theme.space.xs,
    fontSize: theme.font.sizeSm, textDecoration: 'underline' };

  return createPortal(
    <>
      {/* Blocks the page while touring: clicking around must not change what the tour is pointing at. */}
      <div ref={backdropRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 100 }} data-testid="tour-backdrop" />
      <div ref={spotRef} aria-hidden="true" style={{ position: 'fixed', zIndex: 101, borderRadius: theme.radius.md, pointerEvents: 'none',
        boxShadow: `0 0 0 2px ${theme.colors.accent}, 0 0 0 9999px rgba(5, 7, 10, 0.72)`, transition: 'all 160ms ease' }} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId} onKeyDown={onKeyDown}
        data-testid="tour"
        style={{ position: 'fixed', zIndex: 102, maxWidth: 'calc(100vw - 24px)', padding: theme.space.lg,
          display: 'flex', flexDirection: 'column', gap: theme.space.sm, background: theme.colors.bgElevated,
          border: `1px solid ${theme.colors.accent}`, borderRadius: theme.radius.md, boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: theme.space.md }}>
          <small style={{ fontFamily: theme.font.mono, color: theme.colors.textMuted }} data-testid="tour-progress">
            {index + 1} / {steps.length}
          </small>
          {!last && <button type="button" style={textButton} onClick={() => onClose('skipped')}>Skip tour</button>}
        </div>
        <h2 id={titleId} ref={headingRef} tabIndex={-1}
          style={{ margin: 0, fontFamily: theme.font.display, fontWeight: 400, fontSize: 26, letterSpacing: 1, color: theme.colors.accent,
            outline: 'none' }}>
          {step.title}
        </h2>
        <p id={bodyId} style={{ margin: 0, lineHeight: 1.5, color: theme.colors.text }}>{step.body}</p>
        <div style={{ display: 'flex', gap: theme.space.sm, justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: theme.space.sm }}>
          {index > 0 && <button type="button" style={layout.secondary} onClick={() => setIndex(i => i - 1)}>Back</button>}
          {last && step.action && (
            <button type="button" style={layout.secondary} onClick={() => { onClose('done'); step.action.onClick(); }}>
              {step.action.label}
            </button>
          )}
          <button type="button" style={layout.primary} onClick={() => (last ? onClose('done') : setIndex(i => i + 1))}>
            {last ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
