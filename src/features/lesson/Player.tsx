import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Exercise, Lesson } from '../../../content/schema';
import { Mascot } from '../../app/ui';
import { useProgress } from '../progress/store';
import {
  correctAnswer, continueLearn, continueLesson, isAnswerReady, lessonResult, startLesson, submitAnswer, submitWrongPair, type Answer,
} from './engine';
import { ExerciseView } from './ExerciseView';
import { feedbackSpeechText, speakEnglish, useEnglishVoice } from './speech';

type ScoredExercise = Exclude<Exercise, { type: 'learn' }>;

export function FeedbackSheet({ exercise, correct, onContinue, voice }: {
  exercise: ScoredExercise; correct: boolean; onContinue: () => void; voice: SpeechSynthesisVoice | null;
}) {
  const feedbackSpeech = feedbackSpeechText(exercise);
  return (
    <div className={`feedback-sheet ${correct ? 'correct' : 'wrong'}`} role="status">
      <div className="feedback-copy">
        <Mascot pose={correct ? 'cheer' : 'oops'} size={70} className="feedback-mascot" eager />
        <div className="feedback-details">
          <strong>{correct ? 'Правильно! Молодець!' : 'Поки що не вийшло. Спробуємо ще!'}</strong>
          {!correct && <p className="correct-answer"><span>Правильна відповідь:</span> <b>{correctAnswer(exercise)}</b></p>}
          {'explain' in exercise && exercise.explain && (
            <p className={correct ? 'feedback-explain compact' : 'feedback-explain'}>
              <span>Чому так:</span> {exercise.explain}
            </p>
          )}
          {feedbackSpeech && typeof window !== 'undefined' && 'speechSynthesis' in window && (
            <button className="speak-button feedback-speak" type="button"
              onClick={() => speakEnglish(feedbackSpeech, voice)}
              aria-label="Прослухати правильну відповідь англійською">🔊</button>
          )}
        </div>
      </div>
      <button className="action-button" type="button" onClick={onContinue}>Продовжити</button>
    </div>
  );
}

export function Player({ lesson, lessonKey, back, review = false }: { lesson: Lesson; lessonKey: string; back: string; review?: boolean }) {
  const navigate = useNavigate();
  const recordLesson = useProgress(state => state.recordLesson);
  const [state, setState] = useState(() => startLesson(lesson));
  const [answer, setAnswer] = useState<Answer>('');
  const [completed, setCompleted] = useState(false);
  const recorded = useRef(false);
  const exercise = state.queue[0];
  const voice = useEnglishVoice();
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => document.documentElement.style.setProperty(
      '--keyboard-offset',
      `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
    );
    viewport.addEventListener('resize', update); viewport.addEventListener('scroll', update); update();
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--keyboard-offset');
    };
  }, []);
  useEffect(() => {
    if (state.phase !== 'complete' || completed || recorded.current) return;
    recorded.current = true;
    setCompleted(true);
    const result = lessonResult(state);
    void recordLesson(lessonKey, result.stars, result.accuracy, result.xp, state.attempts);
    navigate('/lesson-end', { replace: true, state: { ...result, lessonKey, review } });
  }, [state, completed, lessonKey, navigate, recordLesson, review]);
  if (!exercise) return <div className="lesson-page">Завершуємо урок…</div>;
  const onClose = () => { if (window.confirm('Вийти з уроку? Незавершений урок не збережеться.')) navigate(back); };
  const onContinue = () => { setState(current => continueLesson(current)); setAnswer(''); };
  const onLearn = () => { setState(current => continueLearn(current)); setAnswer(''); };
  const onCheck = () => {
    const next = submitAnswer(state, answer); setState(next);
    if (!next.lastCorrect && typeof navigator.vibrate === 'function') navigator.vibrate(100);
  };
  const onWrongPair = (left: number, right: number) => {
    setState(current => submitWrongPair(current, left, right));
    if (typeof navigator.vibrate === 'function') navigator.vibrate(100);
  };
  const progress = state.total ? Math.round(state.solved.length / state.total * 100) : 0;
  return (
    <div className="lesson-page">
      <header className="lesson-top">
        <button className="close-button" type="button" onClick={onClose} aria-label="Закрити урок">×</button>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={state.solved.length}
          aria-valuemin={0}
          aria-valuemax={state.total}
          aria-label="Прогрес уроку"
        >
          <div className="progress-fill" style={{ width: `${progress}%` }}><span className="progress-dino">🦖</span></div>
        </div>
        <span>{state.solved.length}/{state.total}</span>
      </header>
      <main className="lesson-main">
        <p className="lesson-label">{lesson.title}</p>
        <ExerciseView
          key={`${exercise.id}-${state.attempts.length}`}
          exercise={exercise}
          answer={answer}
          onAnswer={setAnswer}
          onWrongPair={onWrongPair}
          disabled={state.phase !== 'answer'}
        />
      </main>
      {state.phase === 'feedback' && exercise.type !== 'learn' ? (
        <FeedbackSheet exercise={exercise} correct={state.lastCorrect === true} onContinue={onContinue} voice={voice} />
      ) : (
        <footer className="lesson-footer">
          {exercise.type === 'learn' ? (
            <button className="action-button" type="button" onClick={onLearn}>Зрозуміло!</button>
          ) : (
            <button className="action-button" type="button" disabled={!isAnswerReady(exercise, answer)} onClick={onCheck}>
              Перевірити
            </button>
          )}
        </footer>
      )}
    </div>
  );
}
