import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import { getRandomLightDuration } from '@core/games/redLight/redLightEngine';
import { vibrateWrong, vibrateFail, vibrateSuccess } from '@core/utils/vibration';

export function RedLightGame() {
  const {
    redLight,
    redLightTick,
    redLightMove,
    setRedLightLight,
    startRedLightCountdown,
    restartRedLight,
    goToStart,
  } = useGameStore();

  const { position, light, timeLeft, gameStarted, completed, failed, countdown } = redLight;

  const gameTickRef = useRef<number | null>(null);
  const lightTimerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const prevLightRef = useRef(light);

  // Countdown effect
  useEffect(() => {
    if (light === 'countdown' && countdown > 0) {
      countdownRef.current = window.setTimeout(() => {
        startRedLightCountdown();
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [light, countdown, startRedLightCountdown]);

  // Game timer (1 second ticks)
  useEffect(() => {
    if (gameStarted && !completed && !failed) {
      gameTickRef.current = window.setInterval(() => {
        redLightTick();
      }, 1000);
    }

    return () => {
      if (gameTickRef.current) {
        clearInterval(gameTickRef.current);
      }
    };
  }, [gameStarted, completed, failed, redLightTick]);

  // Light change timer
  const scheduleNextLightChange = useCallback(() => {
    if (lightTimerRef.current) {
      clearTimeout(lightTimerRef.current);
    }

    const nextLight = light === 'green' ? 'red' : 'green';
    const duration = getRandomLightDuration(light);

    lightTimerRef.current = window.setTimeout(() => {
      setRedLightLight(nextLight);
    }, duration);
  }, [light, setRedLightLight]);

  useEffect(() => {
    if (gameStarted && !completed && !failed && light !== 'countdown') {
      scheduleNextLightChange();
    }

    return () => {
      if (lightTimerRef.current) {
        clearTimeout(lightTimerRef.current);
      }
    };
  }, [gameStarted, completed, failed, light, scheduleNextLightChange]);

  // Vibration on light change
  useEffect(() => {
    if (light !== prevLightRef.current && gameStarted) {
      if (light === 'red') {
        vibrateWrong();
      }
      prevLightRef.current = light;
    }
  }, [light, gameStarted]);

  // Vibration on game end
  useEffect(() => {
    if (completed) {
      vibrateSuccess();
    } else if (failed) {
      vibrateFail();
    }
  }, [completed, failed]);

  // Handle tap to move
  const handleTap = useCallback(() => {
    if (!gameStarted || completed || failed) return;
    redLightMove();
  }, [gameStarted, completed, failed, redLightMove]);

  // Touch/click event handlers
  useEffect(() => {
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      handleTap();
    };

    const handleClick = () => {
      handleTap();
    };

    document.addEventListener('touchstart', handleTouch, { passive: false });
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('click', handleClick);
    };
  }, [handleTap]);

  const getDollClass = () => {
    if (light === 'countdown') return 'doll-back';
    return light === 'green' ? 'doll-back' : 'doll-front';
  };

  return (
    <div className="screen-fade-in flex flex-col items-center flex-grow px-5 py-6 select-none">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-pink mb-1" style={{ textShadow: '0 0 15px rgba(255, 0, 128, 0.5)' }}>
          🚦 Червоне Світло
        </h2>
        <p className="text-teal">Зелене Світло</p>
      </div>

      {/* Timer */}
      <div className="text-4xl font-bold text-white mb-4">
        {light === 'countdown' ? (
          <span className="countdown-number">{countdown}</span>
        ) : (
          <span className={timeLeft <= 5 ? 'text-red animate-pulse' : ''}>
            {timeLeft}с
          </span>
        )}
      </div>

      {/* Game Field */}
      <div className="game-field relative w-full max-w-sm h-64 bg-dark rounded-2xl border-2 border-gray overflow-hidden mb-6">
        {/* Finish Line */}
        <div className="absolute right-4 top-0 bottom-0 w-1 bg-teal" style={{ boxShadow: '0 0 10px var(--teal)' }}>
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-teal text-xs">🏁</div>
        </div>

        {/* Doll */}
        <div className={`doll ${getDollClass()}`}>
          <div className="doll-body">
            <div className="doll-head">
              {light === 'red' && <div className="doll-eyes">👀</div>}
            </div>
          </div>
        </div>

        {/* Player */}
        <div
          className={`player ${redLight.isMoving ? 'player-running' : ''}`}
          style={{ left: `${Math.min(position, 85)}%` }}
        >
          🏃
        </div>

        {/* Light Indicator */}
        <div className={`light-indicator ${light}`}>
          {light === 'green' ? '🟢' : light === 'red' ? '🔴' : '⚪'}
        </div>

        {/* Instructions */}
        {light === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark/80">
            <div className="text-center">
              <div className="text-6xl mb-2">{countdown}</div>
              <div className="text-teal">Приготуйся!</div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-sm mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Старт</span>
          <span>Фініш</span>
        </div>
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{ width: `${position}%` }}
          />
        </div>
      </div>

      {/* Instructions */}
      <p className="text-center text-teal text-sm mb-4 bg-dark p-3 rounded-xl border border-gray">
        {light === 'countdown'
          ? '👆 Тапай по екрану щоб бігти!'
          : light === 'green'
          ? '🟢 БІЖИ! Тапай швидше!'
          : '🔴 СТІЙ! Не рухайся!'}
      </p>

      {/* Control Buttons */}
      <div className="flex gap-4 mt-auto" onClick={(e) => e.stopPropagation()}>
        <button
          className="btn btn-secondary px-6 py-2 text-sm"
          onClick={(e) => {
            e.stopPropagation();
            restartRedLight();
          }}
        >
          🔄 Заново
        </button>
        <button
          className="btn btn-next px-6 py-2 text-sm !animate-none"
          onClick={(e) => {
            e.stopPropagation();
            goToStart();
          }}
        >
          ← Вийти
        </button>
      </div>
    </div>
  );
}
