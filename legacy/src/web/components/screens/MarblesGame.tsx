import { useGameStore } from '@core/stores/gameStore';
import { Button } from '@web/components/ui/Button';
import { vibrateCorrect, vibrateWrong } from '@core/utils/vibration';

export function MarblesGame() {
  const {
    marbles,
    setMarblesBet,
    setMarblesGuess,
    answerMarbles,
    nextMarblesRound,
    goToStart,
  } = useGameStore();

  const {
    playerMarbles,
    opponentMarbles,
    currentBet,
    playerGuess,
    problem,
    phase,
    roundResult,
  } = marbles;

  const handleAnswer = (answer: number) => {
    if (!problem) return;
    const isCorrect = answer === problem.answer;
    if (isCorrect && playerGuess === (problem.isOdd ? 'odd' : 'even')) {
      vibrateCorrect();
    } else {
      vibrateWrong();
    }
    answerMarbles(answer);
  };

  // Render marbles as circles
  const renderMarbles = (count: number, color: string) => {
    const rows = Math.ceil(count / 5);
    return (
      <div className="flex flex-col gap-1">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 justify-center">
            {Array.from(
              { length: Math.min(5, count - rowIndex * 5) },
              (_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full ${color}`}
                  style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                />
              )
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="screen-fade-in flex flex-col items-center px-5 py-6 min-h-screen">
      {/* Header */}
      <div className="text-center mb-4">
        <h2
          className="text-2xl font-bold text-pink mb-1"
          style={{ textShadow: '0 0 15px rgba(255, 0, 128, 0.5)' }}
        >
          🔮 Гра в кульки
        </h2>
        <p className="text-teal text-sm">Вгадай парне чи непарне!</p>
      </div>

      {/* Marbles display */}
      <div className="flex justify-between w-full max-w-sm mb-6 bg-dark border border-gray rounded-xl p-4">
        <div className="text-center flex-1">
          <div className="text-3xl mb-2">😊</div>
          <div className="text-pink font-bold mb-2">Ти: {playerMarbles}</div>
          {renderMarbles(playerMarbles, 'bg-blue-400')}
        </div>
        <div className="w-px bg-gray mx-4" />
        <div className="text-center flex-1">
          <div className="text-3xl mb-2">👹</div>
          <div className="text-red font-bold mb-2">Він: {opponentMarbles}</div>
          {renderMarbles(opponentMarbles, 'bg-red')}
        </div>
      </div>

      {/* Phase: Bet */}
      {phase === 'bet' && (
        <div className="w-full max-w-sm">
          <h3 className="text-teal text-lg mb-4 text-center">Скільки кульок ставиш?</h3>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((bet) => (
              <button
                key={bet}
                onClick={() => setMarblesBet(bet)}
                disabled={bet > playerMarbles}
                className={`
                  py-3 text-xl font-bold rounded-xl border-2
                  ${
                    currentBet === bet
                      ? 'bg-pink text-dark border-pink'
                      : 'bg-dark text-pink border-pink'
                  }
                  ${bet > playerMarbles ? 'opacity-30' : 'hover:bg-pink/20'}
                  transition-all
                `}
              >
                {bet}
              </button>
            ))}
          </div>
          <div className="text-center text-gray-400 mb-4">
            Твоя ставка: <span className="text-pink font-bold">{currentBet}</span> кульок
          </div>
        </div>
      )}

      {/* Phase: Guess */}
      {phase === 'guess' && (
        <div className="w-full max-w-sm">
          <h3 className="text-teal text-lg mb-4 text-center">
            Відповідь буде парна чи непарна?
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={playerGuess === 'even' ? 'primary' : 'secondary'}
              onClick={() => setMarblesGuess('even')}
            >
              Парне (2,4,6...)
            </Button>
            <Button
              variant={playerGuess === 'odd' ? 'primary' : 'secondary'}
              onClick={() => setMarblesGuess('odd')}
            >
              Непарне (1,3,5...)
            </Button>
          </div>
        </div>
      )}

      {/* Phase: Solve */}
      {phase === 'solve' && problem && (
        <div className="w-full max-w-sm">
          <div className="bg-dark border-2 border-teal rounded-2xl p-6 mb-4">
            <div className="text-sm text-gray-400 mb-2 text-center">
              Твоя ставка: {currentBet} | Твій вибір:{' '}
              {playerGuess === 'odd' ? 'Непарне' : 'Парне'}
            </div>
            <div
              className="text-4xl font-bold text-center text-white"
              style={{ textShadow: '0 0 10px rgba(0, 245, 212, 0.3)' }}
            >
              {problem.a} {problem.op} {problem.b} = ?
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {problem.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                className={`
                  py-4 px-6 text-2xl font-bold rounded-xl
                  border-2 border-teal bg-dark
                  text-teal hover:bg-teal hover:text-dark
                  transition-all duration-200
                  active:scale-95
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phase: Result */}
      {phase === 'result' && problem && (
        <div className="w-full max-w-sm text-center">
          <div className={`text-6xl mb-4 ${roundResult === 'win' ? 'animate-bounce' : ''}`}>
            {roundResult === 'win' ? '✅' : '❌'}
          </div>
          <div
            className={`text-2xl font-bold mb-2 ${
              roundResult === 'win' ? 'text-green' : 'text-red'
            }`}
          >
            {roundResult === 'win' ? 'Виграв раунд!' : 'Програв раунд!'}
          </div>
          <div className="text-gray-400 mb-4">
            Відповідь: {problem.answer} ({problem.isOdd ? 'непарне' : 'парне'})
          </div>
          <div className="text-teal mb-6">
            {roundResult === 'win'
              ? `+${currentBet} кульок тобі!`
              : `-${currentBet} кульок від тебе`}
          </div>
          <Button variant="primary" onClick={nextMarblesRound}>
            Далі
          </Button>
        </div>
      )}

      {/* Back button */}
      <Button variant="next" onClick={goToStart} className="mt-auto !animate-none">
        ← На головну
      </Button>
    </div>
  );
}
