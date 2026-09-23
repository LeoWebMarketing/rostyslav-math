import { useState, useEffect, useRef } from 'react';
import { useGameStore, selectCurrentProblem, selectMathProgress } from '@core/stores/gameStore';
import { ProgressBar } from '@web/components/ui/ProgressBar';
import { Button } from '@web/components/ui/Button';
import { vibrateWrong } from '@core/utils/vibration';

export function MathGame() {
  const currentProblem = useGameStore(selectCurrentProblem);
  const progress = useGameStore(selectMathProgress);
  const {
    mathProblems,
    currentProblemIndex,
    correctAnswers,
    streak,
    isAnswerCorrect,
    submitMathAnswer,
    nextProblem,
  } = useGameStore();

  const [answer, setAnswer] = useState('');
  const [showNext, setShowNext] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset state when moving to new problem
    setAnswer('');
    setShowNext(false);
    inputRef.current?.focus();
  }, [currentProblemIndex]);

  // Handle moving to next problem after feedback shown
  useEffect(() => {
    if (isAnswerCorrect !== null) {
      if (isAnswerCorrect) {
        setShowNext(true);
      } else {
        // Wrong answer - vibrate and allow retry after shake
        vibrateWrong();
        const timer = setTimeout(() => {
          setAnswer('');
          inputRef.current?.focus();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isAnswerCorrect]);

  if (!currentProblem) {
    return null;
  }

  const handleSubmit = () => {
    const numAnswer = parseInt(answer, 10);
    if (isNaN(numAnswer)) return;
    if (showNext) return;

    submitMathAnswer(numAnswer);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showNext) {
        nextProblem();
      } else {
        handleSubmit();
      }
    }
  };

  const handleNextClick = () => {
    nextProblem();
    setShowNext(false);
  };

  return (
    <div className="screen-fade-in flex flex-col flex-grow px-5 py-6 max-w-lg mx-auto w-full">
      {/* Progress */}
      <ProgressBar
        value={progress}
        label={`${currentProblemIndex + 1}/${mathProblems.length}`}
        className="mb-8"
      />

      {/* Streak */}
      {streak >= 2 && (
        <div className="flex items-center justify-center gap-2 mb-4 text-lg text-gold">
          <span className="streak-fire">🔥</span>
          <span>{streak} поспіль!</span>
        </div>
      )}

      {/* Score Display */}
      <div className="flex justify-center gap-6 mb-6 text-sm text-gray-400">
        <span>Правильно: <strong className="text-teal">{correctAnswers}</strong></span>
      </div>

      {/* Problem Card */}
      <div
        className={`problem-card mb-8 ${
          isAnswerCorrect === true ? 'correct-flash' : ''
        } ${isAnswerCorrect === false ? 'shake' : ''}`}
      >
        <div className="text-4xl font-bold tracking-wider" style={{ textShadow: '0 0 10px rgba(0, 245, 212, 0.5)' }}>
          {currentProblem.display}
        </div>
      </div>

      {/* Answer Section */}
      <div className="text-center mb-6">
        <label className="block text-teal mb-3">Відповідь:</label>
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`answer-input ${
            isAnswerCorrect === true ? 'correct' : ''
          } ${isAnswerCorrect === false ? 'wrong' : ''}`}
          placeholder="?"
          autoFocus
          autoComplete="off"
          disabled={showNext}
        />
      </div>

      {/* Action Button */}
      {showNext ? (
        <Button variant="next" onClick={handleNextClick}>
          Далі →
        </Button>
      ) : (
        <Button
          variant={isAnswerCorrect === true ? 'success' : 'primary'}
          onClick={handleSubmit}
          disabled={!answer}
        >
          Перевірити
        </Button>
      )}

      {/* Feedback */}
      {isAnswerCorrect !== null && (
        <div className="feedback" style={{ color: isAnswerCorrect ? 'var(--green)' : 'var(--red)' }}>
          {isAnswerCorrect ? '✓' : '✗'}
        </div>
      )}
    </div>
  );
}
