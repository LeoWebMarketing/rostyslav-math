import { useMemo, useState } from 'react';
import type { Exercise } from '../../../content/schema';
import { Mascot } from '../../app/ui';
import { shuffle, type Answer } from './engine';
import { promptSpeechText, speakEnglish, useEnglishVoice } from './speech';

type Props = {
  exercise: Exercise;
  answer: Answer;
  onAnswer: (answer: Answer) => void;
  onWrongPair: (left: number, right: number) => void;
  disabled: boolean;
};

export function ExerciseView({ exercise, answer, onAnswer, onWrongPair, disabled }: Props) {
  const voice = useEnglishVoice();
  const [left, setLeft] = useState<number | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  const [matched, setMatched] = useState<[number, number][]>([]);
  const [selectedTokens, setSelectedTokens] = useState<number[]>([]);
  const options = useMemo(
    () => exercise.type === 'choice' || exercise.type === 'fill' ? shuffle(exercise.options ?? []) : [],
    [exercise],
  );
  const rightOrder = useMemo(
    () => exercise.type === 'match' ? shuffle(exercise.pairs.map((_, index) => index)) : [],
    [exercise],
  );
  const tokens = useMemo(
    () => exercise.type === 'order' ? shuffle(exercise.tokens.map((_, index) => index)) : [],
    [exercise],
  );
  const prompt = exercise.type === 'math'
    ? exercise.problem
    : exercise.type === 'learn' ? exercise.title
    : exercise.type === 'match' ? 'З’єднай пари' : exercise.type === 'fill' ? 'Заповни пропуск' : exercise.prompt;
  const promptSpeech = promptSpeechText(exercise);
  const speechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const speak = (text: string) => speakEnglish(text, voice);

  if (exercise.type === 'learn') return (
    <article className="learn-card" aria-labelledby={`learn-${exercise.id}`}>
      <span className="learn-kicker">Вивчаємо</span>
      <h1 id={`learn-${exercise.id}`}>{exercise.title}</h1>
      <table className="learn-rows"><tbody>
        {exercise.rows.map(([english, ukrainian], index) => (
          <tr className="learn-row" key={`${exercise.id}-${index}`}>
            <th scope="row"><div className="learn-english">
              <span lang="en">{english}</span>
              <button className="speak-button" type="button" onClick={() => speak(english)}
                aria-label={`Прослухати англійською: ${english}`}>🔊</button>
            </div></th>
            <td>{ukrainian}</td>
          </tr>
        ))}
      </tbody></table>
      {exercise.note && <p className="learn-note">{exercise.note}</p>}
    </article>
  );

  const choice = (value: string, emoji?: string) => (
    <div className="option-row" key={value}>
      <button
        type="button"
        disabled={disabled}
        className={`option-card ${answer === value ? 'selected' : ''}`}
        onClick={() => onAnswer(value)}
      >
        {emoji && <span className="option-emoji">{emoji}</span>}{value}
      </button>
      {speechAvailable && /[A-Za-z]/.test(value) && (
        <button
          className="speak-button option-speak"
          type="button"
          onClick={() => speak(value)}
          aria-label={`Прослухати варіант: ${value}`}
        >🔊</button>
      )}
    </div>
  );

  const input = (numeric = false) => (
    <input
      className="answer-field"
      aria-label="Твоя відповідь"
      type="text"
      inputMode={numeric ? 'decimal' : 'text'}
      autoComplete="off"
      value={typeof answer === 'string' ? answer : ''}
      disabled={disabled}
      onChange={event => onAnswer(event.target.value)}
      onFocus={event => setTimeout(() => event.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100)}
    />
  );

  const match = exercise.type === 'match' ? (
    <div className="match-grid">
      <div>{exercise.pairs.map(([value], index) => (
        <button
          key={index}
          disabled={disabled || shake !== null || matched.some(pair => pair[0] === index)}
          className={`option-card match-cell ${left === index ? 'selected' : ''}
            ${matched.some(pair => pair[0] === index) ? 'matched' : ''} ${shake === index ? 'shake' : ''}`}
          onClick={() => {
            if (/[A-Za-z]/.test(value)) speak(value);
            setLeft(index);
          }}
        >{value}</button>
      ))}</div>
      <div>{rightOrder.map(index => (
        <button
          key={index}
          disabled={disabled || shake !== null || matched.some(pair => pair[1] === index)}
          className={`option-card match-cell ${matched.some(pair => pair[1] === index) ? 'matched' : ''}
            ${shake === index ? 'shake' : ''}`}
          onClick={() => {
            const value = exercise.pairs[index][1];
            if (/[A-Za-z]/.test(value)) speak(value);
            if (left === null) return;
            if (exercise.pairs[left][1] !== value) {
              setShake(left);
              setTimeout(() => onWrongPair(left, index), 350);
              return;
            }
            const next: [number, number][] = [...matched, [left, index]];
            setMatched(next);
            setLeft(null);
            const mapping = exercise.pairs.map((_, pairIndex) => next.find(pair => pair[0] === pairIndex)?.[1] ?? -1);
            onAnswer(mapping);
          }}
        >{exercise.pairs[index][1]}</button>
      ))}</div>
    </div>
  ) : null;

  const toggleToken = (index: number, selected: boolean) => {
    if (exercise.type !== 'order') return;
    const next = selected ? selectedTokens.filter(item => item !== index) : [...selectedTokens, index];
    setSelectedTokens(next);
    onAnswer(next.map(item => exercise.tokens[item]));
  };

  const onKey = (value: string) => {
    const current = typeof answer === 'string' ? answer : '';
    if (value === '⌫') onAnswer(current.slice(0, -1));
    else if (value === '−') onAnswer(current.startsWith('-') ? current.slice(1) : `-${current}`);
    else onAnswer(`${current}${value}`);
  };

  return (
    <div className="exercise-view">
      <div className="prompt-row">
        <h1>{prompt}</h1>
        {speechAvailable && promptSpeech && (
          <button
            className="speak-button"
            type="button"
            onClick={() => speak(promptSpeech)}
            aria-label="Прослухати текст завдання англійською"
          >🔊</button>
        )}
      </div>
      {!disabled && <Mascot pose="thinking" size={64} className="thinking-mascot" eager />}
      {'hint' in exercise && exercise.hint && <p className="hint">Підказка: {exercise.hint}</p>}
      {'image' in exercise && exercise.image && (
        <img
          className="exercise-image"
          src={exercise.image}
          alt="Ілюстрація до завдання"
          width={190}
          height={190}
          loading="lazy"
          decoding="async"
        />
      )}
      {exercise.type === 'choice' && (
        <div className="options">{options.map(value => choice(value, exercise.optionEmoji?.[value]))}</div>
      )}
      {match}
      {exercise.type === 'type' && input()}
      {exercise.type === 'fill' && (
        <>
          <p className="fill-sentence">
            {exercise.prompt.replace('___', typeof answer === 'string' && answer ? answer : '_____')}
          </p>
          {exercise.options ? <div className="options">{options.map(value => choice(value))}</div> : input()}
        </>
      )}
      {exercise.type === 'order' && (
        <>
          <div className="answer-line" aria-label="Складене речення">
            {selectedTokens.length ? selectedTokens.map(index => (
              <button type="button" disabled={disabled} className="word-chip" key={index} onClick={() => toggleToken(index, true)}>
                {exercise.tokens[index]}
              </button>
            )) : <span>Торкнися слів унизу</span>}
          </div>
          <div className="word-bank">{tokens.filter(index => !selectedTokens.includes(index)).map(index => (
            <button type="button" disabled={disabled} className="word-chip" key={index} onClick={() => toggleToken(index, false)}>
              {exercise.tokens[index]}
            </button>
          ))}</div>
        </>
      )}
      {exercise.type === 'math' && (
        <>
          <div className="math-answer">{typeof answer === 'string' && answer ? answer : '▯'}</div>
          <div className="keypad">{['1', '2', '3', '4', '5', '6', '7', '8', '9', '−', '0', '⌫'].map(value => (
            <button type="button" key={value} disabled={disabled} onClick={() => onKey(value)}>{value}</button>
          ))}</div>
        </>
      )}
    </div>
  );
}
