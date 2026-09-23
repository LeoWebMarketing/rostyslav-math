/**
 * Vibration utility for mobile devices
 */

/**
 * Vibrate the device if supported
 * @param pattern - Vibration pattern in milliseconds or single duration
 */
export function vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Silently fail if vibration not supported
    }
  }
}

/**
 * Short vibration for wrong answer
 */
export function vibrateWrong(): void {
  vibrate([100, 50, 100]); // Two short pulses
}

/**
 * Longer vibration for game over / cookie broken
 */
export function vibrateFail(): void {
  vibrate([200, 100, 200, 100, 200]); // Three longer pulses
}

/**
 * Light tap for correct answer
 */
export function vibrateSuccess(): void {
  vibrate(50); // Single short pulse
}

/**
 * Light tap for correct step
 */
export function vibrateCorrect(): void {
  vibrate(30); // Very short pulse
}
