import { describe, expect, it } from 'vitest';
import { createGameState, dueRetryQuestionId, gameReducer, type GameState } from './state';

function answerWall(state: GameState, questionId: string, correct: boolean): GameState {
  return gameReducer(gameReducer(gameReducer(state, { type: 'wall', questionId }), { type: 'answer', correct }), { type: 'continue' });
}

describe('game state', () => {
  it('catches the runner on the third hit and ignores later rewards', () => {
    let state = createGameState('trex');
    for (let step = 1; step <= 3; step++) {
      state = gameReducer(state, { type: 'hit' });
      expect(state.distanceSteps).toBe(step);
      expect(state.phase).toBe(step === 3 ? 'caught' : 'running');
    }
    expect(gameReducer(state, { type: 'ruby' })).toBe(state);
    expect(gameReducer(state, { type: 'escape' })).toBe(state);
  });

  it('restarts the same enclosure with fresh distance, walls and rubies after being caught', () => {
    let state = createGameState('stegosaurus');
    state = answerWall(state, 'mistake', false);
    state = gameReducer(state, { type: 'ruby' });
    state = gameReducer(state, { type: 'hit' });
    state = gameReducer(state, { type: 'hit' });
    expect(state.phase).toBe('caught');
    expect(state.pendingRetries).toHaveLength(1);
    state = gameReducer(state, { type: 'restart' });
    expect(state).toEqual(createGameState('stegosaurus'));
    expect(gameReducer(state, { type: 'jump' }).pose).toBe('jump');
  });

  it('shows correction at the third step before showing the caught screen', () => {
    let state = gameReducer(gameReducer(createGameState('trex'), { type: 'hit' }), { type: 'hit' });
    state = gameReducer(state, { type: 'wall', questionId: 'hard-question' });
    state = gameReducer(state, { type: 'answer', correct: false });
    expect(state.distanceSteps).toBe(3);
    expect(state.phase).toBe('feedback');
    expect(state.lastAnswerCorrect).toBe(false);
    expect(state.currentQuestionId).toBe('hard-question');
    state = gameReducer(state, { type: 'continue' });
    expect(state.phase).toBe('caught');
    expect(state.wallsCleared).toBe(0);
    expect(gameReducer(state, { type: 'restart' })).toEqual(createGameState('trex'));
  });

  it('pauses both runner and clock at question walls and restores the same phase', () => {
    let state = gameReducer(createGameState('raptor'), { type: 'jump' });
    state = gameReducer(state, { type: 'tick', deltaMs: 250 });
    expect(state.poseRemainingMs).toBe(450);
    state = gameReducer(state, { type: 'wall', questionId: 'math-1' });
    expect(state.phase).toBe('question');
    expect(state.pose).toBe('run');
    const stopped = gameReducer(state, { type: 'tick', deltaMs: 500 });
    expect(stopped).toBe(state);
    state = gameReducer(state, { type: 'pause' });
    expect(state.phase).toBe('paused');
    state = gameReducer(state, { type: 'resume' });
    expect(state.phase).toBe('question');
    expect(state.elapsedMs).toBe(250);
  });

  it('shows a wrong question again only after two further walls', () => {
    let state = createGameState('trex');
    state = answerWall(state, 'mistake', false);
    expect(state.distanceSteps).toBe(1);
    expect(state.wallsCleared).toBe(1);
    expect(state.pendingRetries).toEqual([{ questionId: 'mistake', dueAt: 3 }]);
    expect(dueRetryQuestionId(state)).toBeNull();
    state = answerWall(state, 'new-1', true);
    expect(dueRetryQuestionId(state)).toBeNull();
    state = answerWall(state, 'new-2', true);
    expect(dueRetryQuestionId(state)).toBe('mistake');
    state = gameReducer(state, { type: 'wall', questionId: 'mistake' });
    expect(state.pendingRetries).toEqual([]);
    state = gameReducer(state, { type: 'answer', correct: true });
    expect(state.rubies).toBe(9);
    state = gameReducer(state, { type: 'continue' });
    expect(dueRetryQuestionId(state)).toBeNull();
    expect(state.wallsCleared).toBe(4);
  });

  it('only opens the escape gate after the dinosaur wall target', () => {
    for (const [dino, target] of [['raptor', 4], ['triceratops', 5], ['trex', 5], ['stegosaurus', 5], ['pterodactyl', 5]] as const) {
      let state = createGameState(dino);
      expect(state.targetWalls).toBe(target);
      expect(gameReducer(state, { type: 'escape' })).toBe(state);
      for (let wall = 0; wall < target; wall++) state = answerWall(state, `q-${wall}`, true);
      expect(state.wallsCleared).toBe(target);
      state = gameReducer(state, { type: 'escape' });
      expect(state.phase).toBe('escaped');
      expect(state.rubies).toBe(target * 3 + 10);
      expect(gameReducer(state, { type: 'escape' })).toBe(state);
    }
  });

  it('keeps running past the target to revisit a mistake made at the final wall', () => {
    let state = createGameState('raptor');
    for (let wall = 0; wall < 3; wall++) state = answerWall(state, `right-${wall}`, true);
    state = answerWall(state, 'last-wall-mistake', false);
    expect(state.wallsCleared).toBe(4);
    expect(gameReducer(state, { type: 'escape' })).toBe(state);
    expect(dueRetryQuestionId(state)).toBeNull();
    state = answerWall(state, 'filler-1', true);
    state = answerWall(state, 'filler-2', true);
    expect(dueRetryQuestionId(state)).toBe('last-wall-mistake');
    state = answerWall(state, 'last-wall-mistake', true);
    expect(state.pendingRetries).toEqual([]);
    expect(gameReducer(state, { type: 'escape' }).phase).toBe('escaped');
  });

  it('awards one ruby per pickup, three per correct answer and ten once for escape', () => {
    let state = createGameState('raptor');
    state = gameReducer(state, { type: 'ruby' });
    state = gameReducer(state, { type: 'ruby' });
    expect(state.rubies).toBe(2);
    for (let i = 0; i < 4; i++) state = answerWall(state, `right-${i}`, true);
    expect(state.rubies).toBe(14);
    state = gameReducer(state, { type: 'escape' });
    expect(state.rubies).toBe(24);
  });

  it('does not allow answers outside a question or double count a wall', () => {
    const initial = createGameState('raptor');
    expect(gameReducer(initial, { type: 'answer', correct: true })).toBe(initial);
    let state = gameReducer(initial, { type: 'wall', questionId: 'q' });
    state = gameReducer(state, { type: 'answer', correct: true });
    expect(gameReducer(state, { type: 'answer', correct: true })).toBe(state);
    state = gameReducer(state, { type: 'continue' });
    expect(gameReducer(state, { type: 'continue' })).toBe(state);
    expect(state.wallsCleared).toBe(1);
    expect(state.rubies).toBe(3);
  });
});
