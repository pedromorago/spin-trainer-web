// shortcuts.js — keyboard shortcuts of the Quiz answers: the number row, 1..9 and then 0 for the tenth action.

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const TEXT_FIELDS = new Set(['INPUT', 'SELECT', 'TEXTAREA']);
const INTERACTIVE = new Set(['A', 'BUTTON', 'SUMMARY', ...TEXT_FIELDS]);
const INTERACTIVE_ROLES = new Set(['button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'option']);

/** Key that answers with the action at `index`, or undefined if it has none (only ten keys). */
export function shortcutKey(index) {
  return KEYS[index];
}

/** Index of the action that `key` answers among `count` actions, or -1. */
export function actionIndexForKey(key, count) {
  const index = KEYS.indexOf(key);
  return index < count ? index : -1;
}

/** The key belongs to what has the focus: a field where the user types. */
export function isTextField(target) {
  return Boolean(target?.isContentEditable) || TEXT_FIELDS.has(target?.tagName);
}

/** Enter already means something on the focused element (a link, a button, a field). */
export function isInteractive(target) {
  return isTextField(target) || INTERACTIVE.has(target?.tagName) || INTERACTIVE_ROLES.has(target?.getAttribute?.('role'));
}
