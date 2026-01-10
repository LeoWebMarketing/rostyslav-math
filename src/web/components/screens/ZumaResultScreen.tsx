import { useGameStore } from '@core/stores/gameStore';

export function ZumaResultScreen() {
  const { zuma, restartZuma, goToStart } = useGameStore();

  const isWin = zuma.completed;

  return (
    <div className="flex flex-col h-full bg-dark items-center justify-center p-8 text-center">
      {/* Result Icon */}
      <div className={`text-8xl mb-6 ${isWin ? 'animate-bounce' : ''}`}>
        {isWin ? '🎯' : '💥'}
      </div>

      {/* Result Message */}
      <h1 className={`text-3xl font-bold mb-4 ${isWin ? 'text-teal' : 'text-pink'}`}>
        {isWin ? 'Перемога!' : 'Спробуй ще!'}
      </h1>

      <p className="text-gray-400 text-lg mb-8">
        {isWin
          ? 'Ти очистив усі кульки!'
          : 'Кульки дісталися центру...'}
      </p>

      {/* Stats */}
      <div className="bg-dark-lighter rounded-2xl p-6 mb-8 w-full max-w-xs">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-400 text-sm">Рівень</div>
            <div className="text-2xl font-bold text-pink">{zuma.level}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Очки</div>
            <div className="text-2xl font-bold text-teal">{Math.round(zuma.score)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Ціль була</div>
            <div className="text-xl font-bold text-yellow-400">{zuma.targetSum}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Макс комбо</div>
            <div className="text-xl font-bold text-purple-400">{zuma.comboCount}x</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={restartZuma}
          className="w-full py-4 bg-pink text-white font-bold text-xl rounded-xl
                     hover:bg-pink/80 transition-colors"
        >
          {isWin ? 'Наступний рівень' : 'Спробувати знову'}
        </button>
        <button
          onClick={goToStart}
          className="w-full py-3 bg-dark-lighter text-gray-300 font-medium rounded-xl
                     hover:bg-gray-700 transition-colors"
        >
          На головну
        </button>
      </div>
    </div>
  );
}
