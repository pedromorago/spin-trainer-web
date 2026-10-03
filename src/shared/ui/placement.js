// Where floating boxes go (tooltips and the tour's dialog): pure functions over rectangles, tested without a browser.

const MARGIN = 8;

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

/**
 * A tooltip above its trigger, centred, or below it when there is no room above; always inside the viewport.
 * @param trigger {top, bottom, left, width} of the trigger; box {width, height}; viewport {width, height}
 * @returns {{ top, left, side: 'top' | 'bottom' }}
 */
export function placeTooltip(trigger, box, viewport, gap = 8) {
  const above = trigger.top - gap - box.height;
  const side = above >= MARGIN ? 'top' : 'bottom';
  const top = side === 'top' ? above : clamp(trigger.bottom + gap, MARGIN, viewport.height - box.height - MARGIN);
  const left = clamp(trigger.left + trigger.width / 2 - box.width / 2, MARGIN, viewport.width - box.width - MARGIN);
  return { top, left, side };
}

/** Below this width the tour's dialog docks at the bottom of the screen instead of floating next to its target. */
export const SHEET_BREAKPOINT = 640;

/**
 * The tour's dialog: a bottom sheet on narrow screens; next to its target on wide ones (below, else above, else beside
 * it, right then left, level with its visible part); centred when the step has no target or there is no room around it.
 * @param target {top, bottom, left, width} or null
 * @returns {{ mode: 'sheet' | 'floating' | 'centered', top?, left? }}
 */
export function placeDialog(target, box, viewport, gap = 16) {
  if (viewport.width < SHEET_BREAKPOINT) return { mode: 'sheet' };
  const centered = { mode: 'centered', top: (viewport.height - box.height) / 2, left: (viewport.width - box.width) / 2 };
  if (!target) return centered;
  const left = clamp(target.left + target.width / 2 - box.width / 2, MARGIN, viewport.width - box.width - MARGIN);
  if (target.bottom + gap + box.height <= viewport.height - MARGIN) return { mode: 'floating', top: target.bottom + gap, left };
  if (target.top - gap - box.height >= MARGIN) return { mode: 'floating', top: target.top - gap - box.height, left };
  // A target taller than the room left (the grid): the dialog goes beside it, so it does not cover what it explains.
  const visibleMiddle = (Math.max(target.top, 0) + Math.min(target.bottom, viewport.height)) / 2;
  const top = clamp(visibleMiddle - box.height / 2, MARGIN, viewport.height - box.height - MARGIN);
  const right = target.left + target.width + gap;
  if (right + box.width <= viewport.width - MARGIN) return { mode: 'floating', top, left: right };
  if (target.left - gap - box.width >= MARGIN) return { mode: 'floating', top, left: target.left - gap - box.width };
  return centered;
}
