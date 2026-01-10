import { useGameStore } from '@core/stores/gameStore';
import { Button } from '@web/components/ui/Button';

export function StartScreen() {
  const { startMathGame, bestScore, todaySessions, todayCorrect } = useGameStore();

  return (
    <div className="screen-fade-in flex flex-col items-center justify-center flex-grow px-5 py-6">
      {/* Background Shapes */}
      <div className="bg-shapes">
        <div className="shape shape-circle"></div>
        <div className="shape shape-triangle"></div>
        <div className="shape shape-square"></div>
      </div>

      {/* Header */}
      <header className="text-center mb-5">
        <h1 className="text-2xl font-bold text-pink mb-2" style={{ textShadow: '0 0 20px rgba(255, 0, 128, 0.5)' }}>
          SQUID MATH
        </h1>
        <div className="flex justify-center gap-5 text-sm text-teal">
          <span>Сесій: <strong>{todaySessions}</strong></span>
          <span>Правильно: <strong>{todayCorrect}</strong></span>
        </div>
      </header>

      {/* Mascot */}
      <div className="mascot-circle mb-8">
        🦑
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-pink mb-2" style={{ textShadow: '0 0 20px rgba(255, 0, 128, 0.5)' }}>
        Математика Кальмара
      </h2>
      <p className="text-teal mb-8">Розв'яжи 10 прикладів!</p>

      {/* Today Stats */}
      <div className="today-stats w-full max-w-sm mb-8">
        <h3 className="text-teal mb-3 text-center">Сьогодні:</h3>
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">Пройдено сесій:</span>
          <span className="font-bold">{todaySessions}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">Правильних відповідей:</span>
          <span className="font-bold">{todayCorrect}</span>
        </div>
        {bestScore > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Найкращий результат:</span>
            <span className="font-bold text-gold">{bestScore}/10</span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Button variant="primary" onClick={startMathGame}>
          🎮 Почати гру
        </Button>
      </div>
    </div>
  );
}
