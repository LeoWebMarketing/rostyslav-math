import { useGameStore } from '@core/stores/gameStore';
import { getRedLightResult } from '@core/games/redLight/redLightEngine';
import { Button } from '@web/components/ui/Button';

export function RedLightResultScreen() {
  const { redLight, restartRedLight, goToStart, startMathGame } = useGameStore();

  const result = getRedLightResult(redLight);
  const isWin = redLight.completed;

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
            <div className="text-2xl font-bold text-teal">{Math.round(redLight.position)}%</div>
            <div className="text-xs text-gray-400">Пройдено</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-pink">{30 - redLight.timeLeft}с</div>
            <div className="text-xs text-gray-400">Час</div>
          </div>
        </div>
      </div>

      {/* Win Celebration */}
      {isWin && (
        <div className="bonus-unlock mb-6">
          🎉 Ти пройшов!
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Button variant={isWin ? 'success' : 'primary'} onClick={restartRedLight}>
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
