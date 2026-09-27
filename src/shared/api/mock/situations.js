// Catalog of the 17 situations (13 3-max + 4 HU) from the reference PDF; the same one the API serves (seeds V2, V5 and V7).
// In production the API serves it (GET /situations); here it lives only for the mock adapter.
// Stacks and actions come from the PDF's tables and legends; hero and priorActions (ADR-0013), from their titles.
const OPEN = ['MR_4B_C', 'MR_C_C', 'MR_C_F', 'MR_F_F', 'L_C_C', 'L_C_F', 'ALLIN', 'FOLD'];
const act = (position, action) => ({ position, action });

export const SITUATIONS = [
  { key: 'btn_open', label: 'BTN Open', format: '3max', hero: 'BTN', priorActions: [],
    stacks: [25, 20, 15, 12, 10, 8], actions: OPEN, notes: 'At 25 BB, against a 3-bet to 3 BB, yellow (MR/F/F) is a call.' },
  { key: 'sb_open', label: 'SB Open (BTN fold)', format: '3max', hero: 'SB', priorActions: [act('BTN', 'FOLD')],
    stacks: [25, 20, 15, 12, 10, 8], actions: ['MR_4B_C', 'MR_C_C', 'MR_C_F', 'MR_F_F', 'L_C_F', 'L_F', 'ALLIN', 'FOLD'],
    notes: 'The suited part of yellow can be played L/C/F. Use the gray part only against a passive fish.' },
  { key: 'sb_vs_btn_mr', label: 'SB vs BTN Min-Raise', format: '3max', hero: 'SB', priorActions: [act('BTN', 'MIN_RAISE')],
    stacks: [25, 20, 15, 10], actions: ['ALLIN', '3BET_C', 'CALL', 'FOLD'], notes: 'Call the green hands only against two fish.' },
  { key: 'sb_vs_btn_limp', label: 'SB vs BTN Limp', format: '3max', hero: 'SB', priorActions: [act('BTN', 'LIMP')],
    stacks: [25, 20, 15], actions: ['ALLIN', 'ISO_C', 'ISO_F', 'LIMP', 'FOLD'] },
  { key: 'bb_vs_sb_mr', label: 'BB vs SB Min-Raise', format: '3max', hero: 'BB',
    priorActions: [act('BTN', 'FOLD'), act('SB', 'MIN_RAISE')],
    stacks: [25, 20, 15, 10], actions: ['ALLIN', '3BET_C', 'CALL', 'CALL_VS_X2', 'FOLD'] },
  { key: 'bb_vs_sb_limp', label: 'BB vs SB Limp', format: '3max', hero: 'BB',
    priorActions: [act('BTN', 'FOLD'), act('SB', 'LIMP')],
    stacks: [25, 20, 15, 10], actions: ['ALLIN', 'ISO_C', 'CHECK'] },
  // The PDF's "3H OS call" table (V7): one threshold per hand, turned into one range per stack.
  { key: 'bb_vs_sb_os', label: 'BB vs SB Open-Shove', format: '3max', hero: 'BB',
    priorActions: [act('BTN', 'FOLD'), act('SB', 'SHOVE')],
    stacks: [20, 15, 12, 10, 8, 6, 4], actions: ['CALL', 'FOLD'],
    notes: 'The PDF\'s "3H OS call" chart: each hand calls the shove when the effective stack is at most its threshold in BB.' },
  { key: 'bb_vs_btn_mr_sb_fold', label: 'BB vs BTN MR (SB fold)', format: '3max', hero: 'BB',
    priorActions: [act('BTN', 'MIN_RAISE'), act('SB', 'FOLD')],
    stacks: [25, 20, 15, 10], actions: ['ALLIN', '3BET', 'CALL', 'FOLD'] },
  { key: 'bb_vs_btn_limp_sb_fold', label: 'BB vs BTN Limp (SB fold)', format: '3max', hero: 'BB',
    priorActions: [act('BTN', 'LIMP'), act('SB', 'FOLD')],
    stacks: [25, 20, 15, 10], actions: ['ALLIN', 'ISO_C', 'CHECK'] },
  { key: 'bb_vs_btn_mr_sb_3bet', label: 'BB vs BTN MR (SB 3bet)', format: '3max', hero: 'BB',
    priorActions: [act('BTN', 'MIN_RAISE'), act('SB', 'THREE_BET')],
    stacks: [25, 12.5, 10], actions: ['ALLIN', 'CALL', 'FOLD'] },
  // Over a limp, the SB's raise is technically an iso-raise; the PDF calls it "3bet".
  { key: 'bb_vs_btn_limp_sb_3bet', label: 'BB vs BTN Limp (SB 3bet)', format: '3max', hero: 'BB',
    priorActions: [act('BTN', 'LIMP'), act('SB', 'RAISE')],
    stacks: [25, 20, 15, 10], actions: ['ALLIN', '3BET_C', 'CALL', 'FOLD'] },
  { key: 'bb_vs_btn_mr_sb_call', label: 'BB vs BTN MR (SB call)', format: '3max', hero: 'BB',
    priorActions: [act('BTN', 'MIN_RAISE'), act('SB', 'CALL')],
    stacks: [25, 20, 15, 10], actions: ['ALLIN', '3BET', 'CALL', 'FOLD'] },
  { key: 'bb_vs_btn_limp_sb_call', label: 'BB vs BTN Limp (SB call)', format: '3max', hero: 'BB',
    priorActions: [act('BTN', 'LIMP'), act('SB', 'CALL')],
    stacks: [25, 20, 15, 10], actions: ['ALLIN', 'ISO_C', 'CHECK'] },
  { key: 'hu_sb_open', label: 'HU SB Open', format: 'hu', hero: 'SB', priorActions: [],
    stacks: [25, 20, 15, 12, 10, 8], actions: ['MR_4B_C', 'MR_C_C', 'MR_C_F', 'MR_F_F', 'L_PUSH', 'L_C_C', 'L_C_F', 'L_F', 'ALLIN', 'FOLD'] },
  { key: 'hu_bb_vs_mr', label: 'HU BB vs Min-Raise', format: 'hu', hero: 'BB', priorActions: [act('SB', 'MIN_RAISE')],
    stacks: [25, 20, 15, 10, 8], actions: ['ALLIN', '3BET_C', 'CALL', 'FOLD'] },
  { key: 'hu_bb_vs_limp', label: 'HU BB vs Limp', format: 'hu', hero: 'BB', priorActions: [act('SB', 'LIMP')],
    stacks: [25, 20, 15, 12, 10, 8], actions: ['ALLIN', 'ISO_C', 'ISO_F', 'CHECK'] },
  // Stacks = upper bound of each PDF band (25-20, 20-15, 15-12, 12-10, 10-8, 8-6)
  { key: 'hu_bb_vs_os', label: 'HU BB vs Open-Shove', format: 'hu', hero: 'BB', priorActions: [act('SB', 'SHOVE')],
    stacks: [25, 20, 15, 12, 10, 8], actions: ['CALL', 'FOLD'] }
];
