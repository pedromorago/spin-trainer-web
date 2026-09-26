// actions.js — catálogo de acciones compuestas. Una mano tiene UNA acción por (situación, stack).

export const ACTION_LABELS = {
  MR_4B_C: 'MR / 4bet vs 3b / Call AI',
  MR_C_C: 'MR / Call 3b / Call 4b',
  MR_C_F: 'MR / Call 3b / Fold 4b',
  MR_F_F: 'MR / Fold a 3b',
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

/** Acción implícita para manos no listadas en un rango: FOLD, o CHECK si FOLD no aplica. */
export function fallbackAction(situationActions) {
  return situationActions.includes('FOLD') ? 'FOLD' : 'CHECK';
}

export function isValidAction(action, situationActions) {
  return situationActions.includes(action);
}
