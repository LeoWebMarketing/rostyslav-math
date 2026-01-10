import { useGameStore } from '@core/stores/gameStore';
import { getGlassBridgeResult, getBridgeProgress } from '@core/games/glassBridge/glassBridgeEngine';
import { Button } from '@web/components/ui/Button';

export function GlassBridgeResultScreen() {
  const { glassBridge, restartGlassBridge, goToStart, startMathGame } = useGameStore();

  const result = getGlassBridgeResult(glassBridge);
  const progress = getBridgeProgress(glassBridge);
  const isWin = glassBridge.completed;

  return (
    <div className="screen-fade-in flex flex-col items-center justify-center flex-grow px-5 py-6">
      {/* Result Icon */}
      <div className="result-icon text-8xl mb-4">
        {result.emoji}
      </div>

      {/* Title */}
      <h2 className={`text-3xl font-bold mb-4 ${isWin ? 'text-green' : 'text-red'}`}>
        {result.title}
      </h2>

      {/* Message */}
      <p className="text-xl text-teal mb-6">
        {result.message}
      </p>

      {/* Stats */}
      <div className="today-stats mb-6 text-center">
        <div className="text-sm text-gray-400 mb-2">Результат</div>
        <div className="flex justify-center gap-6">
          <div>
            <div className="text-2xl font-bold text-teal">{progress}%</div>
            <div className="text-xs text-gray-400">Пройдено</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-pink">{glassBridge.currentRow + 1}/{glassBridge.totalRows}</div>
            <div className="text-xs text-gray-400">Кроків</div>
          </div>
        </div>
      </div>

      {/* Win Celebration */}
      {isWin && (
        <div className="bonus-unlock mb-6">
          🎉 Ти перейшов міст!
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Button variant={isWin ? 'success' : 'primary'} onClick={restartGlassBridge}>
          🔄 Спробувати ще
        </Button>
        <Button variant="secondary" onClick={startMathGame}>
          📚 Грати в математику
        </Button>
        <Button variant="next" onClick={goToStart} className="!animate-none">
          ← На головну
        </Button>
      </div>
    </div>
  );
}
