import type { RedLightState, LightState } from '@core/types';

/**
 * Game configuration
 */
export const GAME_CONFIG = {
  GAME_DURATION: 30,          // Total game time in seconds
  MOVE_DISTANCE: 2,           // Distance per tap
  FINISH_LINE: 100,           // Finish position
  MIN_GREEN_TIME: 800,        // Min green light duration (ms) - can be very short!
  MAX_GREEN_TIME: 5000,       // Max green light duration (ms)
  MIN_RED_TIME: 800,          // Min red light duration (ms)
  MAX_RED_TIME: 4000,         // Max red light duration (ms)
  REACTION_GRACE: 150,        // Grace period after light change (ms)
};

/**
 * Create initial game state
 */
export function createRedLightState(): RedLightState {
  return {
    position: 0,
    light: 'countdown',
    isMoving: false,
    timeLeft: GAME_CONFIG.GAME_DURATION,
    gameStarted: false,
    completed: false,
    failed: false,
    countdown: 3,
  };
}

/**
 * Get random duration for light state
 */
export function getRandomLightDuration(light: LightState): number {
  if (light === 'green') {
    return Math.random() * (GAME_CONFIG.MAX_GREEN_TIME - GAME_CONFIG.MIN_GREEN_TIME) + GAME_CONFIG.MIN_GREEN_TIME;
  }
  return Math.random() * (GAME_CONFIG.MAX_RED_TIME - GAME_CONFIG.MIN_RED_TIME) + GAME_CONFIG.MIN_RED_TIME;
}

/**
 * Calculate move result
 */
export function calculateMove(
  currentPosition: number,
  light: LightState,
  timeSinceLightChange: number
): { newPosition: number; caught: boolean; finished: boolean } {
  // Grace period after light change
  const inGracePeriod = timeSinceLightChange < GAME_CONFIG.REACTION_GRACE;

  // If red light and not in grace period = caught
  if (light === 'red' && !inGracePeriod) {
    return { newPosition: currentPosition, caught: true, finished: false };
  }

  // Move forward
  const newPosition = Math.min(currentPosition + GAME_CONFIG.MOVE_DISTANCE, GAME_CONFIG.FINISH_LINE);
  const finished = newPosition >= GAME_CONFIG.FINISH_LINE;

  return { newPosition, caught: false, finished };
}

/**
 * Get result message based on game outcome
 */
export function getRedLightResult(state: RedLightState): {
  emoji: string;
  title: string;
  message: string;
} {
  if (state.completed) {
    return {
      emoji: '🏃‍♂️',
      title: 'Перемога!',
      message: 'Ти дійшов до фінішу!'
    };
  }

  if (state.failed) {
    return {
      emoji: '💀',
      title: 'Вибув!',
      message: 'Лялька тебе помітила!'
    };
  }

  // Time ran out
  return {
    emoji: '⏰',
    title: 'Час вийшов!',
    message: 'Спробуй швидше!'
  };
}

/**
 * Get doll rotation based on light state
 */
export function getDollRotation(light: LightState): number {
  return light === 'green' ? 180 : 0;
}
