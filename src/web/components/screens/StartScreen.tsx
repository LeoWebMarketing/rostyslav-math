import { useGameStore } from '@core/stores/gameStore';
import { Button } from '@web/components/ui/Button';

export function StartScreen() {
  const { startMathGame, /* startDalgona, */ startRedLight, startGlassBridge, startTugOfWar, startMarbles, startZuma, bestScore, todaySessions, todayCorrect } = useGameStore();

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

      {/* Mini Games */}
      <div className="w-full max-w-sm mt-8">
        <h3 className="text-teal mb-3 text-center text-sm">Міні-ігри:</h3>
        <div className="grid grid-cols-3 gap-2">
{/* Dalgona hidden - iOS touch issues
          <button
            onClick={() => startDalgona()}
            className="p-3 bg-dark-lighter rounded-lg hover:bg-pink/20 transition-colors text-center"
          >
            <div className="text-2xl mb-1">🍬</div>
            <div className="text-xs text-gray-400">Далгона</div>
          </button>
*/}
          <button
            onClick={startRedLight}
            className="p-3 bg-dark-lighter rounded-lg hover:bg-pink/20 transition-colors text-center"
          >
            <div className="text-2xl mb-1">🚦</div>
            <div className="text-xs text-gray-400">Світло</div>
          </button>
          <button
            onClick={() => startGlassBridge()}
            className="p-3 bg-dark-lighter rounded-lg hover:bg-pink/20 transition-colors text-center"
          >
            <div className="text-2xl mb-1">🌉</div>
            <div className="text-xs text-gray-400">Міст</div>
          </button>
          <button
            onClick={startTugOfWar}
            className="p-3 bg-dark-lighter rounded-lg hover:bg-pink/20 transition-colors text-center"
          >
            <div className="text-2xl mb-1">💪</div>
            <div className="text-xs text-gray-400">Канат</div>
          </button>
          <button
            onClick={startMarbles}
            className="p-3 bg-dark-lighter rounded-lg hover:bg-pink/20 transition-colors text-center"
          >
            <div className="text-2xl mb-1">🔮</div>
            <div className="text-xs text-gray-400">Кульки</div>
          </button>
          <button
            onClick={() => startZuma()}
            className="p-3 bg-dark-lighter rounded-lg hover:bg-pink/20 transition-colors text-center"
          >
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-xs text-gray-400">Зума</div>
          </button>
        </div>
      </div>
    </div>
  );
}
