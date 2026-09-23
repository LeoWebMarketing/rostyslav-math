import { useEffect, useState } from 'react';
import type { Exercise } from '../../../content/schema';

const latinPhrase = /[A-Za-z]+(?:['’\-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’\-][A-Za-z]+)*)*/g;

export function extractLatinSegments(text: string): string[] {
  return text.match(latinPhrase) ?? [];
}

export function promptSpeechText(exercise: Exercise): string | null {
  if (exercise.type === 'match' || exercise.type === 'math') return null;
  const text = extractLatinSegments(exercise.prompt).join('. ');
  const answer = exercise.type === 'order' ? exercise.answer.join(' ') : exercise.answer;
  if (!text || text.toLowerCase().includes(answer.toLowerCase())) return null;
  return text;
}

export function feedbackSpeechText(exercise: Exercise): string | null {
  if (exercise.type === 'math') return null;
  if (exercise.type === 'match') {
    const words = exercise.pairs.flatMap(pair => pair
      .filter(text => /^[A-Za-z]/.test(text.trim()))
      .flatMap(extractLatinSegments));
    return words.length ? [...new Set(words)].join('. ') : null;
  }
  const answer = exercise.type === 'order' ? exercise.answer.join(' ') : exercise.answer;
  const words = extractLatinSegments(answer);
  if (words.length) return words.join('. ');
  const promptWords = extractLatinSegments(exercise.prompt);
  return promptWords.length ? promptWords.join('. ') : null;
}

export function useEnglishVoice(): SpeechSynthesisVoice | null {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const update = () => {
      const voices = window.speechSynthesis.getVoices();
      setVoice(voices.find(item => /^en-GB$/i.test(item.lang)) ?? voices.find(item => /^en-/i.test(item.lang)) ?? null);
    };
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);
  return voice;
}

export function speakEnglish(text: string, voice: SpeechSynthesisVoice | null): void {
  if (!text || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? 'en-GB';
  window.speechSynthesis.speak(utterance);
}
