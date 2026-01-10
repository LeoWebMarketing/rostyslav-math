import { useGameStore } from '@core/stores/gameStore';
import { Button } from '@web/components/ui/Button';

export function TugOfWarResultScreen() {
  const { tugOfWar, restartTugOfWar, goToStart } = useGameStore();
  const { completed, ropePosition } = tugOfWar;

  const isWin = completed;

  return (
    <div className="screen-fade-in flex flex-col items-center justify-center min-h-screen px-5 py-6">
      {/* Result Icon */}
      <div
        className="text-8xl mb-6 animate-bounce"
        style={{
          animationDuration: '1s',
        }}
      >
        {isWin ? '🏆' : '💀'}
      </div>

      {/* Result Text */}
      <h1
        className={`text-4xl font-bold mb-4 ${isWin ? 'text-green' : 'text-red'}`}
        style={{
          textShadow: isWin
            ? '0 0 20px rgba(0, 255, 128, 0.5)'
            : '0 0 20px rgba(255, 0, 0, 0.5)',
        }}
      >
        {isWin ? 'Перемога!' : 'Програш!'}
      </h1>

      {/* Description */}
      <p className="text-teal text-lg mb-2 text-center">
        {isWin
          ? 'Ти перетягнув канат на свій бік!'
          : 'Суперник виявився сильнішим...'}
      </p>

      {/* Final position */}
      <div className="bg-dark border border-gray rounded-xl p-4 mb-8">
        <div className="text-gray-400 text-sm mb-1">Фінальна позиція</div>
        <div className={`text-3xl font-bold ${isWin ? 'text-green' : 'text-red'}`}>
          {ropePosition}%
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button variant="primary" onClick={restartTugOfWar}>
          🔄 Грати ще
        </Button>
        <Button variant="secondary" onClick={goToStart}>
          ← На головну
        </Button>
      </div>
    </div>
  );
}
