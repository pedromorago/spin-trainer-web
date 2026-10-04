// actions.js — catalog of compound actions. A hand has ONE action per (situation, stack).

export const ACTION_LABELS = {
  MR_4B_C: 'MR / 4bet vs 3b / Call AI',
  MR_C_C: 'MR / Call 3b / Call 4b',
  MR_C_F: 'MR / Call 3b / Fold 4b',
  MR_F_F: 'MR / Fold to 3b',
  L_C_C: 'Limp / Call iso / Call AI',
  L_C_F: 'Limp / Call iso / Fold AI',
  L_PUSH: 'Limp / Push',
  L_F: 'Limp / Fold',
  ALLIN: 'All-in',
  '3BET': '3-bet',
  '3BET_C': '3-bet / Call',
  CALL: 'Call',
  CALL_VS_X2: 'Call vs x2',
  ISO_C: 'Iso / Call',
  ISO_F: 'Iso / Fold',
  LIMP: 'Limp',
  CHECK: 'Check',
  FOLD: 'Fold'
};

export const ACTIONS = Object.keys(ACTION_LABELS);

/** What each compound action means, step by step (tooltips and glossary). */
export const ACTION_DESCRIPTIONS = {
  MR_4B_C: 'Min-raise; 4-bet if someone 3-bets; call if they go all-in.',
  MR_C_C: 'Min-raise; call a 3-bet; call a 4-bet.',
  MR_C_F: 'Min-raise; call a 3-bet; fold to a 4-bet.',
  MR_F_F: 'Min-raise; fold if someone 3-bets.',
  L_C_C: 'Limp; call an isolation raise; call an all-in.',
  L_C_F: 'Limp; call an isolation raise; fold to an all-in.',
  L_PUSH: 'Limp; if someone raises, go all-in.',
  L_F: 'Limp; fold if someone raises.',
  ALLIN: 'Go all-in.',
  '3BET': '3-bet: re-raise the raise.',
  '3BET_C': '3-bet; call if they go all-in.',
  CALL: 'Call.',
  CALL_VS_X2: 'Call only against a raise to 2x (a min-raise).',
  ISO_C: 'Raise to isolate the limper; call if they go all-in.',
  ISO_F: 'Raise to isolate the limper; fold if they go all-in.',
  LIMP: 'Limp along: complete the blind.',
  CHECK: 'Check: see the flop without putting in more.',
  FOLD: 'Fold.'
};

/** The charts' abbreviations, in the order a newcomer meets them. */
export const GLOSSARY = [
  ['MR', 'min-raise (to 2 BB)'],
  ['3b / 4b', '3-bet / 4-bet (re-raise / re-re-raise)'],
  ['AI', 'all-in'],
  ['Iso', 'isolation raise over a limper'],
  ['L / C / F', 'limp / call / fold'],
  ['BB', 'big blinds (the stack is the effective one)']
];

/** Implicit action for hands not listed in a range: FOLD, or CHECK if FOLD does not apply. */
export function fallbackAction(situationActions) {
  return situationActions.includes('FOLD') ? 'FOLD' : 'CHECK';
}

export function isValidAction(action, situationActions) {
  return situationActions.includes(action);
}
