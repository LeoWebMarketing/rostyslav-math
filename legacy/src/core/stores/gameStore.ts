import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MathProblem, Screen, Shape, Point, DalgonaState, RedLightState, LightState, GlassBridgeState, TugOfWarState, MarblesState, ZumaState } from '@core/types';
import { generateSession, validateAnswer, getStars, getResultMessage } from '@core/games/math/mathEngine';
import { getRandomShape, createDalgonaState, isOnPath, calculateProgress, isNearStartPoint } from '@core/games/dalgona/dalgonaEngine';
import { createRedLightState, calculateMove } from '@core/games/redLight/redLightEngine';
import { createGlassBridge, stepOnPanel } from '@core/games/glassBridge/glassBridgeEngine';
import { createTugOfWarState, calculateRopeMove } from '@core/games/tugOfWar/tugOfWarEngine';
import { createMarblesState, generateMarblesProblem, calculateMarblesResult } from '@core/games/marbles/marblesEngine';
import { createZumaState } from '@core/games/zuma/zumaEngine';
import { getTodayKey } from '@core/utils/storage';

interface GameState {
  // Screen
  screen: Screen;

  // Math game
  mathProblems: MathProblem[];
  currentProblemIndex: number;
  correctAnswers: number;
  streak: number;
  isAnswerCorrect: boolean | null;

  // Dalgona game
  dalgona: DalgonaState;

  // Red Light game
  redLight: RedLightState;
  lightChangeTime: number;

  // Glass Bridge game
  glassBridge: GlassBridgeState;

  // Tug of War game
  tugOfWar: TugOfWarState;

  // Marbles game
  marbles: MarblesState;

  // Zuma game
  zuma: ZumaState;

  // Stats
  todaySessions: number;
  todayCorrect: number;
  bestScore: number;
  completedShapes: string[];
  statsDate: string;

  // Actions - Navigation
  setScreen: (screen: Screen) => void;
  goToStart: () => void;

  // Actions - Math game
  startMathGame: () => void;
  submitMathAnswer: (answer: number) => void;
  nextProblem: () => void;

  // Actions - Dalgona game
  startDalgona: (shape?: Shape) => void;
  startDalgonaDrawing: (point: Point) => void;
  updateDalgonaDrawing: (point: Point) => void;
  endDalgonaDrawing: () => void;
  restartDalgona: () => void;

  // Actions - Red Light game
  startRedLight: () => void;
  startRedLightCountdown: () => void;
  redLightTick: () => void;
  redLightMove: () => void;
  setRedLightLight: (light: LightState) => void;
  restartRedLight: () => void;

  // Actions - Glass Bridge game
  startGlassBridge: (rows?: number) => void;
  glassBridgeStep: (panelId: number) => void;
  restartGlassBridge: () => void;

  // Actions - Tug of War game
  startTugOfWar: () => void;
  answerTugOfWar: (answer: number) => void;
  restartTugOfWar: () => void;

  // Actions - Marbles game
  startMarbles: () => void;
  setMarblesBet: (bet: number) => void;
  setMarblesGuess: (guess: 'odd' | 'even') => void;
  answerMarbles: (answer: number) => void;
  nextMarblesRound: () => void;
  restartMarbles: () => void;

  // Actions - Zuma game
  startZuma: (level?: number) => void;
  setZumaState: (state: ZumaState) => void;
  restartZuma: () => void;

  // Actions - Stats
  resetDailyStatsIfNeeded: () => void;
}

const CANVAS_SIZE = 300;

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      screen: 'start',
      mathProblems: [],
      currentProblemIndex: 0,
      correctAnswers: 0,
      streak: 0,
      isAnswerCorrect: null,
      dalgona: createDalgonaState(getRandomShape(), CANVAS_SIZE),
      redLight: createRedLightState(),
      lightChangeTime: 0,
      glassBridge: createGlassBridge(),
      tugOfWar: createTugOfWarState(),
      marbles: createMarblesState(),
      zuma: createZumaState(),
      todaySessions: 0,
      todayCorrect: 0,
      bestScore: 0,
      completedShapes: [],
      statsDate: getTodayKey(),

      // Navigation
      setScreen: (screen) => set({ screen }),
      goToStart: () => set({ screen: 'start', isAnswerCorrect: null }),

      // Math game actions
      startMathGame: () => {
        get().resetDailyStatsIfNeeded();
        set({
          screen: 'math',
          mathProblems: generateSession(10),
          currentProblemIndex: 0,
          correctAnswers: 0,
          streak: 0,
          isAnswerCorrect: null,
        });
      },

      submitMathAnswer: (answer) => {
        const { mathProblems, currentProblemIndex, correctAnswers, streak, todayCorrect } = get();
        const problem = mathProblems[currentProblemIndex];
        const isCorrect = validateAnswer(problem, answer);

        if (isCorrect) {
          set({
            correctAnswers: correctAnswers + 1,
            streak: streak + 1,
            todayCorrect: todayCorrect + 1,
            isAnswerCorrect: true,
          });
        } else {
          set({
            streak: 0,
            isAnswerCorrect: false,
          });
        }
      },

      nextProblem: () => {
        const { currentProblemIndex, mathProblems, correctAnswers, todaySessions, bestScore } = get();
        const nextIndex = currentProblemIndex + 1;

        if (nextIndex >= mathProblems.length) {
          // End of game
          const newBest = Math.max(bestScore, correctAnswers);
          set({
            screen: 'mathResult',
            todaySessions: todaySessions + 1,
            bestScore: newBest,
            isAnswerCorrect: null,
          });
        } else {
          set({
            currentProblemIndex: nextIndex,
            isAnswerCorrect: null,
          });
        }
      },

      // Dalgona game actions
      startDalgona: (shape) => {
        const selectedShape = shape || getRandomShape();
        set({
          screen: 'dalgona',
          dalgona: createDalgonaState(selectedShape, CANVAS_SIZE),
        });
      },

      startDalgonaDrawing: (point) => {
        const { dalgona } = get();
        if (dalgona.completed || dalgona.failed) return;

        if (isNearStartPoint(point, dalgona.path, dalgona.tolerance)) {
          set({
            dalgona: {
              ...dalgona,
              isDrawing: true,
              traced: [point],
            },
          });
        }
      },

      updateDalgonaDrawing: (point) => {
        const { dalgona, completedShapes } = get();
        if (!dalgona.isDrawing || dalgona.completed || dalgona.failed) return;

        const check = isOnPath(point, dalgona.path, dalgona.currentIndex, dalgona.tolerance);

        if (check.onPath) {
          const newIndex = Math.max(dalgona.currentIndex, check.index);
          const progress = calculateProgress(newIndex, dalgona.path.length);

          // Check if completed
          if (newIndex >= dalgona.path.length - 5) {
            const newCompletedShapes = dalgona.shape && !completedShapes.includes(dalgona.shape.id)
              ? [...completedShapes, dalgona.shape.id]
              : completedShapes;

            set({
              dalgona: {
                ...dalgona,
                traced: [...dalgona.traced, point],
                currentIndex: newIndex,
                progress: 100,
                completed: true,
                isDrawing: false,
              },
              completedShapes: newCompletedShapes,
            });
          } else {
            set({
              dalgona: {
                ...dalgona,
                traced: [...dalgona.traced, point],
                currentIndex: newIndex,
                progress,
              },
            });
          }
        } else {
          // Lost a life
          const newLives = dalgona.lives - 1;

          if (newLives <= 0) {
            set({
              dalgona: {
                ...dalgona,
                lives: 0,
                failed: true,
                isDrawing: false,
              },
            });
          } else {
            set({
              dalgona: {
                ...dalgona,
                lives: newLives,
              },
            });
          }
        }
      },

      endDalgonaDrawing: () => {
        const { dalgona } = get();
        set({
          dalgona: {
            ...dalgona,
            isDrawing: false,
          },
        });
      },

      restartDalgona: () => {
        const { dalgona } = get();
        if (dalgona.shape) {
          set({
            dalgona: createDalgonaState(dalgona.shape, CANVAS_SIZE),
          });
        }
      },

      // Red Light game actions
      startRedLight: () => {
        set({
          screen: 'redLight',
          redLight: createRedLightState(),
          lightChangeTime: Date.now(),
        });
      },

      startRedLightCountdown: () => {
        const { redLight } = get();
        if (redLight.countdown > 1) {
          set({
            redLight: {
              ...redLight,
              countdown: redLight.countdown - 1,
            },
          });
        } else {
          // Start the game
          set({
            redLight: {
              ...redLight,
              countdown: 0,
              light: 'green',
              gameStarted: true,
            },
            lightChangeTime: Date.now(),
          });
        }
      },

      redLightTick: () => {
        const { redLight } = get();
        if (!redLight.gameStarted || redLight.completed || redLight.failed) return;

        const newTimeLeft = redLight.timeLeft - 1;

        if (newTimeLeft <= 0) {
          // Time's up
          set({
            redLight: {
              ...redLight,
              timeLeft: 0,
              failed: true,
            },
            screen: 'redLightResult',
          });
        } else {
          set({
            redLight: {
              ...redLight,
              timeLeft: newTimeLeft,
              isMoving: false, // Reset moving state each tick
            },
          });
        }
      },

      redLightMove: () => {
        const { redLight, lightChangeTime } = get();
        if (!redLight.gameStarted || redLight.completed || redLight.failed) return;

        const timeSinceLightChange = Date.now() - lightChangeTime;
        const result = calculateMove(redLight.position, redLight.light, timeSinceLightChange);

        if (result.caught) {
          set({
            redLight: {
              ...redLight,
              failed: true,
              isMoving: true,
            },
            screen: 'redLightResult',
          });
        } else if (result.finished) {
          set({
            redLight: {
              ...redLight,
              position: result.newPosition,
              completed: true,
              isMoving: true,
            },
            screen: 'redLightResult',
          });
        } else {
          set({
            redLight: {
              ...redLight,
              position: result.newPosition,
              isMoving: true,
            },
          });
        }
      },

      setRedLightLight: (light) => {
        set({
          redLight: {
            ...get().redLight,
            light,
          },
          lightChangeTime: Date.now(),
        });
      },

      restartRedLight: () => {
        set({
          screen: 'redLight',
          redLight: createRedLightState(),
          lightChangeTime: Date.now(),
        });
      },

      // Glass Bridge game actions
      startGlassBridge: (rows) => {
        set({
          screen: 'glassBridge',
          glassBridge: createGlassBridge(rows),
        });
      },

      glassBridgeStep: (panelId) => {
        const { glassBridge } = get();
        if (glassBridge.completed || glassBridge.failed) return;

        const result = stepOnPanel(glassBridge, panelId);

        if (result.newState.completed || result.newState.failed) {
          set({
            glassBridge: result.newState,
            screen: 'glassBridgeResult',
          });
        } else {
          set({
            glassBridge: result.newState,
          });
        }
      },

      restartGlassBridge: () => {
        const { glassBridge } = get();
        set({
          screen: 'glassBridge',
          glassBridge: createGlassBridge(glassBridge.totalRows),
        });
      },

      // Tug of War game actions
      startTugOfWar: () => {
        set({
          screen: 'tugOfWar',
          tugOfWar: createTugOfWarState(),
        });
      },

      answerTugOfWar: (answer) => {
        const { tugOfWar } = get();
        if (tugOfWar.isAnswering || tugOfWar.completed || tugOfWar.failed) return;

        const currentProblem = tugOfWar.problems[tugOfWar.currentProblemIndex];
        const isCorrect = answer === currentProblem.answer;
        const result = calculateRopeMove(tugOfWar.ropePosition, isCorrect);

        if (result.completed || result.failed) {
          set({
            tugOfWar: {
              ...tugOfWar,
              ropePosition: result.newPosition,
              completed: result.completed,
              failed: result.failed,
              isAnswering: true,
            },
            screen: 'tugOfWarResult',
          });
        } else {
          // Move to next problem
          set({
            tugOfWar: {
              ...tugOfWar,
              ropePosition: result.newPosition,
              currentProblemIndex: tugOfWar.currentProblemIndex + 1,
            },
          });
        }
      },

      restartTugOfWar: () => {
        set({
          screen: 'tugOfWar',
          tugOfWar: createTugOfWarState(),
        });
      },

      // Marbles game actions
      startMarbles: () => {
        set({
          screen: 'marbles',
          marbles: createMarblesState(),
        });
      },

      setMarblesBet: (bet) => {
        const { marbles } = get();
        if (marbles.phase !== 'bet') return;

        set({
          marbles: {
            ...marbles,
            currentBet: Math.min(bet, marbles.playerMarbles),
            phase: 'guess',
          },
        });
      },

      setMarblesGuess: (guess) => {
        const { marbles } = get();
        if (marbles.phase !== 'guess') return;

        set({
          marbles: {
            ...marbles,
            playerGuess: guess,
            problem: generateMarblesProblem(),
            phase: 'solve',
          },
        });
      },

      answerMarbles: (answer) => {
        const { marbles } = get();
        if (marbles.phase !== 'solve' || !marbles.problem) return;

        const result = calculateMarblesResult(marbles, answer);

        const newState = {
          ...marbles,
          playerMarbles: result.newPlayerMarbles,
          opponentMarbles: result.newOpponentMarbles,
          roundResult: result.won ? 'win' as const : 'lose' as const,
          phase: 'result' as const,
        };

        // Check for game end
        if (result.newPlayerMarbles <= 0) {
          set({
            marbles: { ...newState, failed: true },
            screen: 'marblesResult',
          });
        } else if (result.newOpponentMarbles <= 0) {
          set({
            marbles: { ...newState, completed: true },
            screen: 'marblesResult',
          });
        } else {
          set({ marbles: newState });
        }
      },

      nextMarblesRound: () => {
        const { marbles } = get();
        if (marbles.phase !== 'result') return;

        set({
          marbles: {
            ...marbles,
            currentBet: 1,
            playerGuess: null,
            problem: null,
            phase: 'bet',
            roundResult: null,
          },
        });
      },

      restartMarbles: () => {
        set({
          screen: 'marbles',
          marbles: createMarblesState(),
        });
      },

      // Zuma game actions
      startZuma: (level = 1) => {
        set({
          screen: 'zuma',
          zuma: createZumaState(level),
        });
      },

      setZumaState: (zumaState) => {
        set({ zuma: zumaState });
      },

      restartZuma: () => {
        const { zuma } = get();
        const nextLevel = zuma.completed ? zuma.level + 1 : zuma.level;
        set({
          screen: 'zuma',
          zuma: createZumaState(nextLevel),
        });
      },

      // Stats
      resetDailyStatsIfNeeded: () => {
        const { statsDate, bestScore } = get();
        const today = getTodayKey();

        if (statsDate !== today) {
          set({
            statsDate: today,
            todaySessions: 0,
            todayCorrect: 0,
            bestScore, // Keep best score
          });
        }
      },
    }),
    {
      name: 'squid-math-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        todaySessions: state.todaySessions,
        todayCorrect: state.todayCorrect,
        bestScore: state.bestScore,
        completedShapes: state.completedShapes,
        statsDate: state.statsDate,
      }),
    }
  )
);

// Selectors
export const selectCurrentProblem = (state: GameState) =>
  state.mathProblems[state.currentProblemIndex];

export const selectMathProgress = (state: GameState) =>
  ((state.currentProblemIndex + 1) / state.mathProblems.length) * 100;

export const selectMathResult = (state: GameState) => ({
  correct: state.correctAnswers,
  total: state.mathProblems.length,
  stars: getStars(state.correctAnswers, state.mathProblems.length),
  ...getResultMessage(state.correctAnswers, state.mathProblems.length),
});

export const selectCanPlayDalgona = (state: GameState) =>
  state.correctAnswers >= 8;
