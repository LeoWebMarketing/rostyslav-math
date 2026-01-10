import type { MarblesProblem, MarblesState } from '@core/types';

export function generateMarblesProblem(): MarblesProblem {
  const op = Math.random() > 0.5 ? '+' : '-';
  let a: number, b: number, answer: number;

  if (op === '+') {
    a = Math.floor(Math.random() * 10) + 1;
    b = Math.floor(Math.random() * 10) + 1;
    answer = a + b;
  } else {
    a = Math.floor(Math.random() * 10) + 10;
    b = Math.floor(Math.random() * a) + 1;
    answer = a - b;
  }

  const isOdd = answer % 2 !== 0;

  // Generate 3 options
  const options = new Set<number>([answer]);
  while (options.size < 3) {
    const offset = Math.floor(Math.random() * 5) + 1;
    const wrong = Math.random() > 0.5 ? answer + offset : Math.max(1, answer - offset);
    if (wrong > 0 && wrong !== answer) {
      options.add(wrong);
    }
  }

  return {
    a,
    b,
    op,
    answer,
    isOdd,
    options: [...options].sort(() => Math.random() - 0.5),
  };
}

export function createMarblesState(): MarblesState {
  return {
    playerMarbles: 10,
    opponentMarbles: 10,
    currentBet: 1,
    playerGuess: null,
    problem: null,
    phase: 'bet',
    roundResult: null,
    completed: false,
    failed: false,
  };
}

export function calculateMarblesResult(
  state: MarblesState,
  selectedAnswer: number
): {
  isCorrect: boolean;
  guessCorrect: boolean;
  won: boolean;
  newPlayerMarbles: number;
  newOpponentMarbles: number;
} {
  if (!state.problem || !state.playerGuess) {
    return {
      isCorrect: false,
      guessCorrect: false,
      won: false,
      newPlayerMarbles: state.playerMarbles,
      newOpponentMarbles: state.opponentMarbles,
    };
  }

  const isCorrect = selectedAnswer === state.problem.answer;
  const answerIsOdd = state.problem.isOdd;
  const guessCorrect = (state.playerGuess === 'odd') === answerIsOdd;

  // Win if answer is correct AND guess is correct
  const won = isCorrect && guessCorrect;

  let newPlayerMarbles = state.playerMarbles;
  let newOpponentMarbles = state.opponentMarbles;

  if (won) {
    // Player wins - takes opponent's bet
    newPlayerMarbles += state.currentBet;
    newOpponentMarbles -= state.currentBet;
  } else {
    // Player loses - gives marbles to opponent
    newPlayerMarbles -= state.currentBet;
    newOpponentMarbles += state.currentBet;
  }

  return {
    isCorrect,
    guessCorrect,
    won,
    newPlayerMarbles: Math.max(0, newPlayerMarbles),
    newOpponentMarbles: Math.max(0, newOpponentMarbles),
  };
}
