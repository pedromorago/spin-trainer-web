import { theme } from './theme';

// Presentación: acción -> color. El dominio no conoce colores.
// Invariante (test): dentro de una misma situación no hay dos acciones con el mismo color.
export const ACTION_COLORS = {
  MR_4B_C: theme.colors.actionCyan, MR_C_C: theme.colors.actionRed, MR_C_F: theme.colors.actionYellow,
  MR_F_F: theme.colors.actionPink, L_C_C: theme.colors.actionGreen, L_C_F: theme.colors.actionBlue,
  L_PUSH: theme.colors.actionPurple, L_F: theme.colors.actionBrown,
  ALLIN: theme.colors.actionOrange, '3BET': theme.colors.actionRed, '3BET_C': theme.colors.actionRed, CALL: theme.colors.actionGreen, CALL_VS_X2: theme.colors.actionBlue,
  ISO_C: theme.colors.actionRed, ISO_F: theme.colors.actionYellow, LIMP: theme.colors.actionPurple,
  CHECK: theme.colors.actionGreen, FOLD: theme.colors.actionGray
};

export const colorFor = action => ACTION_COLORS[action] ?? theme.colors.actionGray;
