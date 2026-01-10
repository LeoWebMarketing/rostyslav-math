import { useGameStore } from '@core/stores/gameStore';
import { Button } from '@web/components/ui/Button';

export function DalgonaResultScreen() {
  const {
    dalgona,
    goToStart,
    startDalgona
  } = useGameStore();

  const isWin = dalgona.completed;
  const progress = dalgona.progress;

  return (
    <div className="screen-fade-in flex flex-col items-center justify-center flex-grow px-5 py-6">
      {/* Result Card */}
      <div className={`bg-dark-light rounded-3xl p-8 border-2 text-center mb-8 w-full max-w-sm ${
        isWin
          ? 'border-green-400 shadow-[0_0_30px_rgba(46,213,115,0.5)]'
          : 'border-red-500 shadow-[0_0_30px_rgba(255,71,87,0.5)]'
      }`}>
        {/* Emoji */}
        <div className="result-icon text-7xl mb-4">
          {isWin ? '🎉' : '💔'}
        </div>

        {/* Message */}
        <h2 className={`text-3xl font-bold text-white mb-4 ${isWin ? 'perfect-score' : ''}`}>
          {isWin ? 'Перемога!' : 'Спробуй ще!'}
        </h2>

        {/* Progress */}
        <div className="bg-dark rounded-2xl p-4 mb-4">
          <div className="text-gray-400 text-sm mb-1">Прогрес</div>
          <div className="text-3xl font-bold text-teal">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Shape completed */}
        {dalgona.shape && (
          <div className="text-xl mb-4">
            <span className="text-2xl">{dalgona.shape.icon}</span>
            <span className="text-gray-400 ml-2">{dalgona.shape.name}</span>
          </div>
        )}

        {/* Encouragement */}
        <p className="text-gray-400 text-sm">
          {isWin
            ? 'Чудова робота! Ти справжній майстер!'
            : 'Не здавайся! Спробуй ще раз!'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button variant="primary" onClick={() => startDalgona()}>
          🔄 Грати ще
        </Button>
        <Button variant="secondary" onClick={goToStart}>
          🏠 На головну
        </Button>
      </div>
    </div>
  );
}
