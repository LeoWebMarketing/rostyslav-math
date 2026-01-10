import { useGameStore } from '@core/stores/gameStore';
import { Button } from '@web/components/ui/Button';

export function MathResultScreen() {
  const {
    correctAnswers,
    mathProblems,
    bestScore,
    goToStart,
    startMathGame,
    startDalgona
  } = useGameStore();

  const total = mathProblems.length;
  const isNewBest = correctAnswers > bestScore;
  const showDalgonaBonus = correctAnswers >= 8;

  const getStars = () => {
    if (correctAnswers >= 10) return '⭐⭐⭐';
    if (correctAnswers >= 8) return '⭐⭐';
    if (correctAnswers >= 5) return '⭐';
    return '';
  };

  const getMessage = () => {
    if (correctAnswers >= 10) return { emoji: '🏆', text: 'Ідеально!' };
    if (correctAnswers >= 8) return { emoji: '🎉', text: 'Чудово!' };
    if (correctAnswers >= 5) return { emoji: '👍', text: 'Добре!' };
    return { emoji: '💪', text: 'Спробуй ще!' };
  };

  const { emoji, text } = getMessage();
  const stars = getStars();

  return (
    <div className="screen-fade-in flex flex-col items-center justify-center flex-grow px-5 py-6">
      {/* Stars */}
      {stars && (
        <div className="result-stars text-5xl mb-4">
          {stars}
        </div>
      )}

      {/* Emoji */}
      <div className="result-icon text-8xl mb-4">
        {emoji}
      </div>

      {/* Title */}
      <h2 className={`text-3xl font-bold text-white mb-4 ${correctAnswers >= 10 ? 'perfect-score' : ''}`}>
        {text}
      </h2>

      {/* Stats */}
      <div className="text-xl text-teal mb-6">
        Правильно: {correctAnswers} з {total}
      </div>

      {/* New Best */}
      {isNewBest && (
        <div className="bonus-unlock mb-4">
          🏆 Новий рекорд!
        </div>
      )}

      {/* Dalgona Bonus */}
      {showDalgonaBonus && (
        <div className="bonus-unlock mb-6">
          🎉 Бонус розблоковано: Dalgona!
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Button variant="success" onClick={startMathGame}>
          Грати ще раз
        </Button>
        {showDalgonaBonus && (
          <Button variant="secondary" onClick={() => startDalgona()}>
            🍪 Грати в Dalgona
          </Button>
        )}
        <Button variant="next" onClick={goToStart} className="!animate-none">
          На головну
        </Button>
      </div>
    </div>
  );
}
