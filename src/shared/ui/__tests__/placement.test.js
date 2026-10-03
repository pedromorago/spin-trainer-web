import { describe, expect, it } from 'vitest';
import { placeDialog, placeTooltip, SHEET_BREAKPOINT } from '../placement';

const viewport = { width: 1000, height: 800 };
const rect = (left, top, width, height) => ({ left, top, width, height, bottom: top + height, right: left + width });

describe('placeTooltip', () => {
  const box = { width: 200, height: 40 };

  it('goes above the trigger, centred on it', () => {
    expect(placeTooltip(rect(400, 300, 100, 30), box, viewport)).toEqual({ top: 252, left: 350, side: 'top' });
  });

  it('goes below when there is no room above', () => {
    expect(placeTooltip(rect(400, 20, 100, 30), box, viewport)).toEqual({ top: 58, left: 350, side: 'bottom' });
  });

  it('exactly the margin above still fits', () => {
    expect(placeTooltip(rect(400, 56, 100, 30), box, viewport).side).toBe('top');
    expect(placeTooltip(rect(400, 55, 100, 30), box, viewport).side).toBe('bottom');
  });

  it('never leaves the viewport sideways', () => {
    expect(placeTooltip(rect(0, 300, 20, 20), box, viewport).left).toBe(8);
    expect(placeTooltip(rect(980, 300, 20, 20), box, viewport).left).toBe(792);
  });

  it('below, it stays inside the bottom edge', () => {
    expect(placeTooltip(rect(400, 30, 100, 790), box, { width: 1000, height: 800 }).top).toBe(752);
  });
});

describe('placeDialog', () => {
  const box = { width: 400, height: 200 };

  it('is a bottom sheet on narrow screens, whatever the target', () => {
    expect(placeDialog(rect(10, 10, 50, 50), box, { width: SHEET_BREAKPOINT - 1, height: 800 })).toEqual({ mode: 'sheet' });
    expect(placeDialog(null, box, { width: SHEET_BREAKPOINT, height: 800 }).mode).toBe('centered');
  });

  it('is centred when the step has no target', () => {
    expect(placeDialog(null, box, viewport)).toEqual({ mode: 'centered', top: 300, left: 300 });
  });

  it('floats below the target when it fits, else above it', () => {
    expect(placeDialog(rect(300, 100, 200, 50), box, viewport)).toEqual({ mode: 'floating', top: 166, left: 200 });
    expect(placeDialog(rect(300, 600, 200, 50), box, viewport)).toEqual({ mode: 'floating', top: 384, left: 200 });
  });

  it('goes beside a tall target, right first, level with its visible part', () => {
    expect(placeDialog(rect(100, 100, 400, 600), box, viewport)).toEqual({ mode: 'floating', top: 300, left: 516 });
    expect(placeDialog(rect(500, 100, 400, 600), box, viewport)).toEqual({ mode: 'floating', top: 300, left: 84 });
  });

  it('beside a target taller than the viewport, it stays level with what is on screen', () => {
    expect(placeDialog(rect(100, -400, 400, 1600), box, viewport)).toEqual({ mode: 'floating', top: 300, left: 516 });
    expect(placeDialog(rect(100, 150, 400, 1600), box, viewport).top).toBe(375);
  });

  it('is centred when the target leaves no room on any side', () => {
    expect(placeDialog(rect(100, 100, 800, 600), box, viewport).mode).toBe('centered');
  });

  it('stays inside the viewport sideways', () => {
    expect(placeDialog(rect(0, 100, 40, 40), box, viewport).left).toBe(8);
    expect(placeDialog(rect(960, 100, 40, 40), box, viewport).left).toBe(592);
  });
});
