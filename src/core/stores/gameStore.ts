import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MathProblem, Screen, Shape, Point, DalgonaState } from '@core/types';
import { generateSession, validateAnswer, getStars, getResultMessage } from '@core/games/math/mathEngine';
import { getRandomShape, createDalgonaState, isOnPath, calculateProgress, isNearStartPoint } from '@core/games/dalgona/dalgonaEngine';
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
