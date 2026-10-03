import { Children, cloneElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { placeTooltip } from './placement';
import { theme } from '../theme/theme';

const HIDE_DELAY_MS = 120;

// Keyboard focus, not the focus a click also gives: browsers without :focus-visible count every focus.
const focusVisible = element => { try { return element.matches(':focus-visible'); } catch { return true; } };

const box = {
  position: 'fixed', top: 0, left: 0, zIndex: 120, maxWidth: 300, padding: `${theme.space.sm} ${theme.space.md}`,
  background: '#1d2430', color: theme.colors.text, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm,
  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.45)', fontSize: theme.font.sizeSm, fontWeight: 400, lineHeight: 1.45,
  textAlign: 'left', whiteSpace: 'normal', letterSpacing: 0, textTransform: 'none'
};

/**
 * Accessible tooltip (WAI-ARIA tooltip pattern, WCAG 1.4.13). It opens on hover and on keyboard focus and closes on
 * Escape, on blur, on a tap elsewhere or when the pointer leaves both the trigger and the tooltip (so it can be hovered
 * to read it). Pressing the trigger closes it too, unless it is a click-to-open one: it must not cover what the click
 * changes. Its text is the trigger's description (aria-describedby): screen readers read it even while hidden.
 * It is fixed and placed inside the viewport (placement.js), imperatively: no re-render while scrolling.
 * Props: content (node), children (one element, the trigger), openOnClick (a click also opens it: touch screens have
 * no hover)
 */
export function Tooltip({ content, children, openOnClick = false }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const boxRef = useRef(null);
  const hideTimer = useRef(null);

  const show = () => { clearTimeout(hideTimer.current); setOpen(true); };
  const hideSoon = () => { clearTimeout(hideTimer.current); hideTimer.current = setTimeout(() => setOpen(false), HIDE_DELAY_MS); };
  const hide = () => { clearTimeout(hideTimer.current); setOpen(false); };

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const trigger = triggerRef.current;
      const tip = boxRef.current;
      if (!trigger || !tip) return;
      const { top, left } = placeTooltip(trigger.getBoundingClientRect(), { width: tip.offsetWidth, height: tip.offsetHeight },
        { width: window.innerWidth, height: window.innerHeight });
      tip.style.top = `${top}px`;
      tip.style.left = `${left}px`;
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = event => { if (event.key === 'Escape') hide(); };
    const onPointer = event => {
      if (!triggerRef.current?.contains(event.target) && !boxRef.current?.contains(event.target)) hide();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const child = Children.only(children);
  // The trigger keeps its own props; only its description changes. The wrapper takes the events (focus and click bubble).
  // The box goes to <body> (a fixed box inside a filtered or transformed ancestor, like the header, would be placed
  // relative to it); React still treats it as inside the wrapper, so moving the pointer onto it does not close it.
  const trigger = cloneElement(child, { 'aria-describedby': [child.props['aria-describedby'], id].filter(Boolean).join(' ') });

  return (
    <span ref={triggerRef} style={{ display: 'inline-flex', position: 'relative' }} onMouseEnter={show} onMouseLeave={hideSoon}
      onFocus={event => { if (focusVisible(event.target)) show(); }} onBlur={hide}
      onPointerDown={openOnClick ? undefined : hide} onClick={openOnClick ? show : undefined}>
      {trigger}
      {createPortal(<span ref={boxRef} id={id} role="tooltip" hidden={!open} style={box}>{content}</span>, document.body)}
    </span>
  );
}

/**
 * A small "?" button that explains what is next to it: the way to reach a tooltip on touch screens and by keyboard.
 * Props: label (accessible name, e.g. "About Any"), children (the explanation), testId
 */
export function InfoTip({ label, children, testId }) {
  return (
    <Tooltip content={children} openOnClick>
      <button type="button" aria-label={label} data-testid={testId}
        style={{ width: 24, height: 24, padding: 0, flexShrink: 0, display: 'inline-flex', alignItems: 'center',
          justifyContent: 'center', borderRadius: '50%', border: `1px solid ${theme.colors.border}`, background: 'transparent',
          color: theme.colors.textMuted, fontSize: 12, fontWeight: 700, lineHeight: 1, cursor: 'help', verticalAlign: 'middle' }}>
        ?
      </button>
    </Tooltip>
  );
}
