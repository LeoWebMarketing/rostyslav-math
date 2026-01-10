import { useGameStore } from '@core/stores/gameStore';
import { Button } from '@web/components/ui/Button';
import { vibrateCorrect, vibrateWrong } from '@core/utils/vibration';

export function TugOfWarGame() {
  const { tugOfWar, answerTugOfWar, goToStart } = useGameStore();
  const { ropePosition, problems, currentProblemIndex, isAnswering } = tugOfWar;

  const currentProblem = problems[currentProblemIndex];

  const handleAnswer = (answer: number) => {
    if (isAnswering) return;

    const isCorrect = answer === currentProblem.answer;
    if (isCorrect) {
      vibrateCorrect();
    } else {
      vibrateWrong();
    }

    answerTugOfWar(answer);
  };

  return (
    <div className="screen-fade-in flex flex-col items-center px-5 py-6 min-h-screen">
      {/* Header */}
      <div className="text-center mb-4">
        <h2
          className="text-2xl font-bold text-pink mb-1"
          style={{ textShadow: '0 0 15px rgba(255, 0, 128, 0.5)' }}
        >
          🪢 Перетягування канату
        </h2>
        <p className="text-teal text-sm">Розв'яжи приклад, щоб тягнути!</p>
      </div>

      {/* Teams */}
      <div className="flex justify-between w-full max-w-sm mb-4">
        <div className="text-center">
          <div className="text-4xl mb-1">👥</div>
          <div className="text-pink font-bold">Ти</div>
        </div>
        <div className="text-center">
          <div className="text-4xl mb-1">👹</div>
          <div className="text-blue-400 font-bold">Суперник</div>
        </div>
      </div>

      {/* Rope visualization */}
      <div className="w-full max-w-sm mb-6">
        <div className="relative h-12 bg-gray rounded-full overflow-hidden border-2 border-gray">
          {/* Left side (player) */}
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink to-pink/50 transition-all duration-500"
            style={{ width: `${ropePosition}%` }}
          />
          {/* Right side (opponent) */}
          <div
            className="absolute right-0 top-0 h-full bg-gradient-to-l from-blue-500 to-blue-500/50 transition-all duration-500"
            style={{ width: `${100 - ropePosition}%` }}
          />
          {/* Center marker */}
          <div
            className="absolute top-0 h-full w-2 bg-yellow-400 transition-all duration-500 shadow-lg"
            style={{
              left: `${ropePosition}%`,
              transform: 'translateX(-50%)',
              boxShadow: '0 0 10px rgba(255, 255, 0, 0.8)',
            }}
          />
          {/* Rope texture */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-3 bg-amber-700 rounded-full opacity-60" />
          </div>
        </div>
        {/* Position labels */}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Перемога!</span>
          <span>{ropePosition}%</span>
          <span>Програш</span>
        </div>
      </div>

      {/* Problem counter */}
      <div className="text-center mb-4">
        <span className="text-gray-400 text-sm">
          Приклад {currentProblemIndex + 1} / {problems.length}
        </span>
      </div>

      {/* Math Problem */}
      <div className="bg-dark border-2 border-pink rounded-2xl p-6 mb-6 w-full max-w-sm">
        <div
          className="text-4xl font-bold text-center text-white"
          style={{ textShadow: '0 0 10px rgba(255, 0, 128, 0.3)' }}
        >
          {currentProblem.a} {currentProblem.op} {currentProblem.b} = ?
        </div>
      </div>

      {/* Answer Options */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-6">
        {currentProblem.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(option)}
            disabled={isAnswering}
            className={`
              py-4 px-6 text-2xl font-bold rounded-xl
              border-2 border-teal bg-dark
              text-teal hover:bg-teal hover:text-dark
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-95
            `}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Back button */}
      <Button variant="secondary" onClick={goToStart} className="mt-auto">
        ← На головну
      </Button>
    </div>
  );
}
