// Steps of the first-visit tour (ADR-0022). It runs on the Explorer, where every element it points at is on screen;
// a step whose element is missing (e.g. "Any" hides the grid) is shown centred instead.

/** @param {{ demo: boolean, onTryQuiz: () => void }} options */
export function explorerTour({ demo, onTryQuiz }) {
  return [
    {
      title: 'Welcome to Spin Trainer',
      body: 'Preflop ranges for Spin & Go, 3-max and heads-up, from the reference charts. This short tour shows you around.'
        + (demo ? ' No account needed: your progress is saved in this browser.' : '')
    },
    {
      target: '[data-tour="tabs"]',
      title: 'Four ways to train',
      body: 'Explorer shows and edits the ranges. Quiz asks you hand by hand. Builder has you paint a range from memory. '
        + 'Stats shows your progress and the hands you keep missing.'
    },
    {
      target: '[data-tour="situation"]',
      title: 'Pick a situation',
      body: 'Each one is a spot from the charts: your seat, what the players before you did and the actions you can take.'
    },
    {
      target: '[data-tour="stacks"]',
      title: 'Pick a stack',
      body: 'The effective stack in big blinds. Any lets the Quiz and the Builder pick situations and stacks at random.'
    },
    {
      target: '[data-tour="palette"]',
      title: 'Actions and colors',
      body: 'Each color is an action. Hover or focus one to read what it means, or open the ? to see them all. '
        + 'Press Edit to paint with them.'
    },
    {
      target: '[data-tour="grid"]',
      title: 'The 13×13 grid',
      body: 'Pairs on the diagonal, suited hands above it, offsuit below. Press Edit to paint hands and make the range '
        + 'your own, then Save; Reset brings back the reference one.'
    },
    {
      target: '[data-tour="panel"]',
      title: 'Range summary',
      body: 'How many hands and combos the range plays, split by action, and the chart\'s tip for this spot.'
    },
    {
      target: '[data-tour="score"]',
      title: 'Your session',
      body: 'Accuracy, streak and hands answered in the Quiz this session. The full history is in Stats.'
    },
    {
      title: 'You\'re all set',
      body: 'Start with the Quiz to test yourself. The Tour button at the top brings this tour back any time.',
      action: { label: 'Try the Quiz', onClick: onTryQuiz }
    }
  ];
}
