import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { contentRegistry } from '../../../content';
import { Art, Mascot, Shell } from '../../app/ui';
import { api } from '../../lib/api';
import { speakEnglish, useEnglishVoice } from '../lesson/speech';
import { useProgress } from '../progress/store';
import { buildQuestionPool, questionSpeechText, type GameQuestion } from './questions';
import { createGameState, DINOSAURS, dueRetryQuestionId, gameReducer, type DinoId, type GameAction, type GameState } from './state';
import './game.css';

const artRoot = '/theme/dino/game/';
const dinoIds: DinoId[] = ['raptor', 'triceratops', 'trex', 'stegosaurus', 'pterodactyl'];
const artNames = [
  'dino-raptor', 'dino-triceratops', 'dino-trex', 'dino-stegosaurus', 'dino-pterodactyl',
  'runner-run', 'runner-jump', 'runner-duck', 'obstacle-log', 'obstacle-branch',
  'obstacle-wall', 'obstacle-fence', 'wall-rubble', 'gate-exit', 'ruby', 'bg-far', 'bg-near', 'ground',
] as const;
type Images = Record<string, HTMLImageElement | null>;
type Context = { grade: number; subject: string; section: string };

function imageUrl(name: string) { return `${artRoot}${name}.webp`; }

async function preloadImages(): Promise<Images> {
  const entries = await Promise.all(artNames.map(name => new Promise<[string, HTMLImageElement | null]>(resolve => {
    const image = new Image();
    image.onload = () => resolve([name, image]);
    image.onerror = () => resolve([name, null]);
    image.src = imageUrl(name);
  })));
  return Object.fromEntries(entries);
}

function wheelSlice(index: number) {
  const a = (-90 + index * 72) * Math.PI / 180;
  const b = a + 72 * Math.PI / 180;
  return `M 100 100 L ${100 + 96 * Math.cos(a)} ${100 + 96 * Math.sin(a)} A 96 96 0 0 1 ${100 + 96 * Math.cos(b)} ${100 + 96 * Math.sin(b)} Z`;
}

const wheelColours = ['#FFC23D', '#5CC8F5', '#B04ADB', '#8EE0A8', '#FF8A3D'];
const hotspotPositions = ['top-left', 'top-right', 'centre', 'bottom-left', 'bottom-right'];

function ParkMap({ context, onRun }: { context: Context; onRun: (dino: DinoId) => void }) {
  const tickets = useProgress(state => state.gameTickets);
  const spendTicket = useProgress(state => state.spendGameTicket);
  const hasQuestions = useMemo(() => buildQuestionPool({ sections: contentRegistry, ...context, mistakes: [] }).length > 0,
    [context.grade, context.subject, context.section]);
  const [inspected, setInspected] = useState<DinoId>('raptor');
  const [selected, setSelected] = useState<DinoId | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const spin = () => {
    if (spinning || !hasQuestions || !spendTicket()) return;
    const index = Math.floor(Math.random() * dinoIds.length);
    const desired = -36 - index * 72;
    const remainder = ((desired - angle) % 360 + 360) % 360;
    setSelected(null);
    setSpinning(true);
    setAngle(angle + 1440 + remainder);
    timer.current = setTimeout(() => {
      setSelected(dinoIds[index]);
      setInspected(dinoIds[index]);
      setSpinning(false);
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 150 : 3600);
  };
  return <Shell title="Парк динозаврів" back={`/g/${context.grade}/${context.subject}`} contentClassName="game-content">
    <div className="game-map-layout">
      <div className="park-map" aria-label="Карта парку з п’ятьма вольєрами">
        <picture>
          <source media="(min-width: 1024px) and (orientation: landscape)" srcSet={imageUrl('park-map-wide')} />
          <img src={imageUrl('park-map-tall')} alt="Мальована карта парку динозаврів" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />
        </picture>
        {dinoIds.map((dino, index) => <button
          key={dino} type="button" className={`park-hotspot ${hotspotPositions[index]} ${selected === dino ? 'chosen' : ''} ${inspected === dino ? 'inspected' : ''}`}
          onClick={() => setInspected(dino)} aria-label={`Вольєр: ${DINOSAURS[dino].name}`}
        >
          <Art file={imageUrl(`dino-${dino}`)} fallback="🦕" width={76} height={76} alt="" />
          <span>{DINOSAURS[dino].name}</span>
        </button>)}
      </div>
      <section className="game-map-panel" aria-label="Колесо вольєрів">
        <h1>Втеча від динозавра</h1>
        <p>Відповідай на запитання, долай перешкоди й збирай рубіни!</p>
        <p className="game-tickets" aria-live="polite">🎟️ Забіги: {tickets} з 3</p>
        <div className="game-wheel-wrap">
          <span className="game-wheel-pointer" aria-hidden="true">▼</span>
          <svg className={`game-wheel ${spinning ? 'spinning' : ''}`} viewBox="0 0 200 200" style={{ transform: `rotate(${angle}deg)` }} role="img" aria-label="Колесо з п’ятьма динозаврами">
            {dinoIds.map((dino, index) => {
              const centre = (-54 + index * 72) * Math.PI / 180;
              return <g key={dino}>
                <path d={wheelSlice(index)} fill={wheelColours[index]} stroke="#12352A" strokeWidth="2" />
                <image href={imageUrl(`dino-${dino}`)} x={100 + 59 * Math.cos(centre) - 16} y={100 + 59 * Math.sin(centre) - 18} width="32" height="32" />
                <text x={100 + 65 * Math.cos(centre)} y={100 + 65 * Math.sin(centre) + 18} textAnchor="middle" fontSize="9" fontWeight="800" fill="#12352A" transform={`rotate(${54 - index * 72}, ${100 + 65 * Math.cos(centre)}, ${100 + 65 * Math.sin(centre) + 18})`}>{DINOSAURS[dino].name}</text>
              </g>;
            })}
            <circle cx="100" cy="100" r="17" fill="#FFF6DF" stroke="#12352A" strokeWidth="3" />
            <text x="100" y="107" textAnchor="middle" fontSize="20">🦖</text>
          </svg>
        </div>
        <p aria-live="polite" className="game-spin-result">{selected ? `Твій вольєр: ${DINOSAURS[selected].name}!` : spinning ? 'Колесо крутиться…' : `Подивись на ${DINOSAURS[inspected].name.toLowerCase()} або крути колесо.`}</p>
        {selected ? <button className="action-button" type="button" onClick={() => onRun(selected)}>Вперед у вольєр!</button>
          : <button className="action-button" type="button" onClick={spin} disabled={!tickets || spinning || !hasQuestions}>Крутити!</button>}
        {!tickets && !selected && <p className="game-no-ticket">Пройди урок — і отримаєш забіг.</p>}
        {!hasQuestions && <p className="game-no-ticket">Для цього розділу поки немає запитань для забігу.</p>}
      </section>
    </div>
  </Shell>;
}

type SceneItem = { kind: 'log' | 'branch' | 'wall' | 'fence' | 'ruby' | 'gate'; x: number; hit?: boolean };
type Scene = { items: SceneItem[]; fragments: { x: number; y: number; age: number; kind: 'wall' | 'fence' }[]; offset: number; spawnIn: number; ordinarySinceWall: number; wallWaiting: boolean; sawQuestion: boolean; gateSent: boolean; shake: number; flash: number; tickMs: number };

function drawSprite(ctx: CanvasRenderingContext2D, images: Images, name: string, x: number, y: number, w: number, h: number, colour: string) {
  const image = images[name];
  if (image) ctx.drawImage(image, x, y, w, h);
  else { ctx.fillStyle = colour; ctx.fillRect(x, y, w, h); }
}

const spriteFoot: Record<string, number> = {
  'runner-run': 753 / 768, 'runner-jump': 752 / 768, 'runner-duck': 752 / 768,
  'dino-raptor': 1, 'dino-triceratops': 991 / 1024, 'dino-trex': 1011 / 1024,
  'dino-stegosaurus': 978 / 1024, 'dino-pterodactyl': 1009 / 1024,
  'obstacle-log': 370 / 384, 'obstacle-branch': 359 / 384,
  'obstacle-wall': 1001 / 1024, 'obstacle-fence': 752 / 768, 'gate-exit': 1,
};

function drawStandingSprite(ctx: CanvasRenderingContext2D, images: Images, name: string,
  x: number, footY: number, w: number, h: number, colour: string, glow = false) {
  ctx.save();
  ctx.fillStyle = 'rgba(20, 34, 24, .32)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, footY + 5, w * .34, Math.max(5, Math.min(13, h * .055)), 0, 0, Math.PI * 2);
  ctx.fill();
  if (glow) {
    ctx.shadowColor = 'rgba(255, 250, 222, .95)';
    ctx.shadowBlur = 7;
  }
  drawSprite(ctx, images, name, x, footY - h * (spriteFoot[name] ?? 1), w, h, colour);
  ctx.restore();
}

function tiled(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null, offset: number, y: number, width: number, height: number, colour: string) {
  if (!image) { ctx.fillStyle = colour; ctx.fillRect(0, y, width, height); return; }
  const tileWidth = height * image.naturalWidth / image.naturalHeight;
  if (!Number.isFinite(tileWidth) || tileWidth <= 0) return;
  const start = -(offset % tileWidth);
  for (let x = start; x < width; x += tileWidth) ctx.drawImage(image, x, y, tileWidth, height);
}

function RunnerCanvas({ state, dispatch, images, onWall, dino }: {
  state: GameState; dispatch: React.Dispatch<GameAction>; images: Images; onWall: () => void; dino: DinoId;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const wallRef = useRef(onWall);
  stateRef.current = state;
  wallRef.current = onWall;
  const scene = useRef<Scene>({ items: [], fragments: [], offset: 0, spawnIn: 0.7, ordinarySinceWall: 0, wallWaiting: false, sawQuestion: false, gateSent: false, shake: 0, flash: 0, tickMs: 0 });
  const touchY = useRef<number | null>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const ctx = element.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    let last = 0;
    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = element.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      element.width = Math.max(1, Math.round(width * dpr));
      element.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element); resize();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const draw = (time: number) => {
      const dt = last ? Math.min(50, time - last) : 16;
      last = time;
      const current = stateRef.current;
      const world = scene.current;
      const running = current.phase === 'running';
      if (current.phase === 'question' || current.phase === 'feedback') world.sawQuestion = true;
      const speed = Math.max(170, width * .29) * DINOSAURS[dino].speed;
      const groundY = height * (height > width ? .70 : .72);
      const pathY = groundY + (height - groundY) * .21;
      const kidHeight = Math.min(220, Math.max(96, height * .30));
      const kidWidth = kidHeight;
      const dinoHeight = Math.max(130, height * .42);
      const dinoWidth = dinoHeight;
      const kidX = Math.min(width * .40, 330);
      const dinoX = kidX - dinoWidth - Math.max(24, width * .04) + current.distanceSteps * 24;
      if (running && world.wallWaiting && world.sawQuestion) {
        world.wallWaiting = false;
        world.sawQuestion = false;
        const wall = world.items.find(item => item.kind === 'wall');
        if (wall) {
          world.fragments.push({ x: wall.x, y: pathY - kidHeight * .45, age: 0, kind: 'wall' });
          world.items = world.items.filter(item => item !== wall);
        }
      }
      if (running && width && height) {
        world.tickMs += dt;
        if (world.tickMs >= 50) { dispatch({ type: 'tick', deltaMs: world.tickMs }); world.tickMs = 0; }
        world.offset += speed * dt / 1000;
        world.spawnIn -= dt / 1000;
        if (world.spawnIn <= 0 && !world.items.some(item => item.kind === 'wall' || item.kind === 'gate')) {
          const needWall = current.wallsCleared < current.targetWalls || current.pendingRetries.length > 0;
          let kind: SceneItem['kind'];
          if (!needWall && !world.gateSent) { kind = 'gate'; world.gateSent = true; }
          else if (needWall && world.ordinarySinceWall >= 2) { kind = 'wall'; world.ordinarySinceWall = 0; }
          else {
            const branchChance = dino === 'stegosaurus' || dino === 'pterodactyl' ? .68 : dino === 'raptor' ? .25 : .42;
            kind = dino === 'triceratops' && Math.random() < .22 ? 'fence' : Math.random() < branchChance ? 'branch' : 'log';
            world.ordinarySinceWall++;
          }
          world.items.push({ kind, x: width + 70 });
          if (kind === 'log' || kind === 'branch' || kind === 'fence') world.items.push({ kind: 'ruby', x: width + 70 + Math.max(95, width * .19) });
          world.spawnIn = kind === 'wall' ? 2.3 : kind === 'gate' ? 99 : 1.45;
        }
        for (const item of world.items) {
          item.x -= speed * dt / 1000;
          if (item.kind === 'fence' && item.x <= dinoX + dinoWidth * .7) {
            world.fragments.push({ x: item.x, y: pathY - kidHeight * .45, age: 0, kind: 'fence' });
            item.x = -200;
            continue;
          }
          const contactX = item.kind === 'wall' ? kidX + kidWidth * .9 : kidX + kidWidth * .65;
          if (item.hit || item.x > contactX) continue;
          item.hit = true;
          if (item.kind === 'wall') { world.wallWaiting = true; wallRef.current(); }
          else if (item.kind === 'gate') dispatch({ type: 'escape' });
          else if (item.kind === 'ruby') { if (current.pose === 'jump') dispatch({ type: 'ruby' }); }
          else if (item.kind !== 'fence' && !(item.kind === 'log' && current.pose === 'jump') && !(item.kind === 'branch' && current.pose === 'duck')) {
            dispatch({ type: 'hit' }); world.shake = reduceMotion.matches ? 0 : 180; world.flash = 180;
          }
        }
        world.items = world.items.filter(item => item.x > -Math.max(240, kidHeight * 1.5));
      }
      world.fragments = world.fragments.filter(fragment => fragment.age < 450);
      for (const fragment of world.fragments) fragment.age += dt;
      world.shake = Math.max(0, world.shake - dt);
      world.flash = Math.max(0, world.flash - dt);
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      if (!reduceMotion.matches) {
        if (world.shake) ctx.translate(Math.sin(time * .09) * 3, 0);
        if (dino === 'trex' && Math.sin(time / 550) > .97) ctx.translate(0, Math.sin(time * .12) * 2);
      }
      ctx.fillStyle = '#9dded2'; ctx.fillRect(0, 0, width, height);
      tiled(ctx, images['bg-far'], world.offset * .12, 0, width, groundY, '#9dded2');
      ctx.fillStyle = '#284b3c'; ctx.fillRect(0, groundY * .19, width, groundY * .81);
      ctx.save(); ctx.globalAlpha = .55;
      tiled(ctx, images['bg-near'], world.offset * .4, groundY * .19, width, groundY * .81, '#4aa66b');
      ctx.restore();
      tiled(ctx, images.ground, world.offset, groundY, width, height - groundY, '#8f7149');
      for (const item of world.items) {
        if (item.kind === 'ruby') drawSprite(ctx, images, 'ruby', item.x, pathY - kidHeight * .85, kidHeight * .29, kidHeight * .29, '#b04adb');
        if (item.kind === 'log') drawStandingSprite(ctx, images, 'obstacle-log', item.x, pathY, kidHeight * .78, kidHeight * .39, '#7a4a30');
        if (item.kind === 'branch') drawStandingSprite(ctx, images, 'obstacle-branch', item.x, pathY, kidHeight * .9, kidHeight * .45, '#276144');
        if (item.kind === 'wall') drawStandingSprite(ctx, images, 'obstacle-wall', item.x, pathY, kidHeight * .98, kidHeight * 1.3, '#ad8261');
        if (item.kind === 'fence') drawStandingSprite(ctx, images, 'obstacle-fence', item.x, pathY, kidHeight * .75, kidHeight * .75, '#97764e');
        if (item.kind === 'gate') drawStandingSprite(ctx, images, 'gate-exit', item.x, pathY, kidHeight * 1.35, kidHeight * 1.35, '#ffc23d');
      }
      for (const fragment of world.fragments) {
        const rise = fragment.age / 10;
        if (fragment.kind === 'wall') drawSprite(ctx, images, 'wall-rubble', fragment.x - rise / 3, fragment.y + rise, 70, 48, '#ad8261');
        else {
          ctx.fillStyle = '#96744d';
          ctx.fillRect(fragment.x - rise, fragment.y - rise, 18, 8);
          ctx.fillRect(fragment.x + rise / 2, fragment.y - rise / 2, 16, 8);
          ctx.fillRect(fragment.x + rise, fragment.y + rise / 3, 14, 8);
        }
      }
      drawStandingSprite(ctx, images, `dino-${dino}`, dinoX, pathY, dinoWidth, dinoHeight, '#2f8959', true);
      const kidLift = current.pose === 'jump' ? kidHeight * .62 : 0;
      const poseHeight = current.pose === 'duck' ? kidHeight * .7 : kidHeight;
      drawStandingSprite(ctx, images, `runner-${current.pose}`, kidX, pathY - kidLift, kidWidth, poseHeight, '#ffc23d', true);
      if (world.flash) { ctx.fillStyle = `rgba(255, 194, 61, ${world.flash / 1000})`; ctx.fillRect(0, 0, width, height); }
      ctx.restore();
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [dino, dispatch, images]);
  return <canvas ref={canvas} className="runner-canvas" aria-label="Дитина біжить праворуч, а динозавр наздоганяє її зліва. Стрибай через колоди та пригинайся під гілками."
    onTouchStart={event => { touchY.current = event.touches[0]?.clientY ?? null; }}
    onTouchEnd={event => {
      if (touchY.current === null) return;
      const delta = (event.changedTouches[0]?.clientY ?? touchY.current) - touchY.current;
      if (delta < -25) dispatch({ type: 'jump' });
      if (delta > 25) dispatch({ type: 'duck' });
      touchY.current = null;
    }} />;
}

function Runner({ dino, context, images, onMap }: { dino: DinoId; context: Context; images: Images; onMap: () => void }) {
  const [state, dispatch] = useReducer(gameReducer, dino, createGameState);
  const [runId, setRunId] = useState(0);
  const [remoteMistakes, setRemoteMistakes] = useState<string[]>([]);
  const gameMistakes = useProgress(progress => progress.gameMistakes);
  const gamePractised = useProgress(progress => progress.gamePractised);
  const guestMistakes = useProgress(progress => progress.guest.mistakes);
  const user = useProgress(progress => progress.user);
  const activeProfileId = useProgress(progress => progress.activeProfileId);
  const addGameRubies = useProgress(progress => progress.addGameRubies);
  const recordGameMistake = useProgress(progress => progress.recordGameMistake);
  const markGamePractised = useProgress(progress => progress.markGamePractised);
  const voice = useEnglishVoice();
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const previousRubies = useRef(0);
  const deckIndex = useRef(0);
  const lastQuestionId = useRef<string | null>(null);
  const seenQuestions = useRef(new Map<string, GameQuestion>());
  useEffect(() => {
    if (!user || !activeProfileId) return;
    api.review(activeProfileId)
      .then(data => setRemoteMistakes(data.mistakes.map(item => `${item.lessonKey}|${item.exerciseId}`)))
      .catch(() => setRemoteMistakes([]));
  }, [user, activeProfileId]);
  const mistakes = useMemo(() => [...new Set([...(user ? remoteMistakes : guestMistakes), ...gameMistakes])]
    .filter(key => !gamePractised.includes(key)), [user, remoteMistakes, guestMistakes, gameMistakes, gamePractised]);
  const questions = useMemo(() => buildQuestionPool({ sections: contentRegistry, ...context, mistakes }), [context.grade, context.subject, context.section, mistakes]);
  const speechText = currentQuestion?.speak ? questionSpeechText(currentQuestion) : null;
  const questionRef = useRef(questions);
  questionRef.current = questions;
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    const delta = state.rubies - previousRubies.current;
    if (delta > 0) addGameRubies(delta);
    previousRubies.current = state.rubies;
  }, [state.rubies, addGameRubies]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (stateRef.current.phase !== 'running') return;
      if (event.code === 'Space' && (event.target as HTMLElement | null)?.closest('button, a, input, textarea, select')) return;
      if (event.code === 'ArrowUp' || event.code === 'Space') { event.preventDefault(); dispatch({ type: 'jump' }); }
      if (event.code === 'ArrowDown') { event.preventDefault(); dispatch({ type: 'duck' }); }
    };
    const handleVisibility = () => { if (document.hidden) dispatch({ type: 'pause' }); };
    window.addEventListener('keydown', handleKey);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => { window.removeEventListener('keydown', handleKey); document.removeEventListener('visibilitychange', handleVisibility); };
  }, []);
  const pickQuestion = useCallback(() => {
    const pool = questionRef.current;
    if (!pool.length) return;
    const retry = dueRetryQuestionId(stateRef.current);
    let question = retry ? pool.find(item => item.id === retry) ?? seenQuestions.current.get(retry) : undefined;
    if (!question) {
      for (let offset = 0; offset < pool.length; offset++) {
        const index = (deckIndex.current + offset) % pool.length;
        if (pool[index].id !== lastQuestionId.current || pool.length === 1) {
          question = pool[index]; deckIndex.current = index + 1; break;
        }
      }
    }
    if (!question) question = pool[0];
    seenQuestions.current.set(question.id, question);
    lastQuestionId.current = question.id;
    setCurrentQuestion(question);
    dispatch({ type: 'wall', questionId: question.id });
  }, []);
  const answer = (option: string) => {
    if (!currentQuestion || state.phase !== 'question') return;
    const correct = option === currentQuestion.answer;
    dispatch({ type: 'answer', correct });
    if (!correct) {
      recordGameMistake(currentQuestion.reviewKey);
    } else markGamePractised(currentQuestion.reviewKey);
  };
  const retry = () => {
    dispatch({ type: 'resume' });
    setRunId(value => value + 1);
    setCurrentQuestion(null);
    previousRubies.current = 0;
    deckIndex.current = 0;
    lastQuestionId.current = null;
    seenQuestions.current.clear();
    dispatch({ type: 'restart' });
  };
  return <div className="jungle-page game-run-page">
    <header className="game-run-header">
      <button type="button" className="game-header-button" onClick={() => dispatch({ type: 'pause' })} aria-label="Пауза"><span aria-hidden="true">⏸</span><span className="game-pause-label"> Пауза</span></button>
      <div className="game-distance" aria-label={`Динозавр наблизився на ${state.distanceSteps} з 3 кроків`}>
        <span>🦖</span><span className="game-distance-track"><span style={{ width: `${Math.max(8, 100 - state.distanceSteps * 31)}%` }} /></span><span>🏃</span>
      </div>
      <span className="game-run-rubies"><Art file={imageUrl('ruby')} fallback="💎" width={25} height={25} alt="" /> {state.rubies}</span>
    </header>
    <p className="game-turn-hint">Поверни пристрій — так зручніше</p>
    <div className="game-stage">
      <RunnerCanvas key={runId} state={state} dispatch={dispatch} images={images} onWall={pickQuestion} dino={dino} />
      {state.phase === 'running' && <div className="game-controls">
        <button type="button" onClick={() => dispatch({ type: 'jump' })} aria-label="Стрибок">⬆ Стрибок</button>
        <button type="button" onClick={() => dispatch({ type: 'duck' })} aria-label="Пригнутися">⬇ Пригнутися</button>
      </div>}
      {(state.phase === 'question' || state.phase === 'feedback') && currentQuestion && <div className="game-overlay" role="dialog" aria-modal="true" aria-label="Запитання на стіні" tabIndex={-1} ref={node => { if (node && document.activeElement !== node && state.phase === 'question') node.focus(); }}>
        <div className="game-question-card">
          <p className="game-question-progress">Стіна {state.wallsCleared + 1} · {DINOSAURS[dino].name}</p>
          <h2>{currentQuestion.prompt}</h2>
          {state.phase === 'question' ? <div className="game-answer-list">{currentQuestion.options.map(option => <button key={option} type="button" onClick={() => answer(option)}>{option}</button>)}</div>
            : <div className="game-feedback" aria-live="polite">
              {state.lastAnswerCorrect ? <p className="game-right">✓ Правильно! +3 рубіни</p> : <><p className="game-wrong">Спробуємо ще раз згодом.</p><p className="game-correct-answer">Правильна відповідь: <strong>{currentQuestion.answer}</strong></p></>}
              {currentQuestion.explain && <p>Чому так: {currentQuestion.explain}</p>}
              {speechText && <button type="button" className="game-speak" onClick={() => speakEnglish(speechText, voice)} aria-label="Прослухати правильну відповідь англійською">🔊 Послухати</button>}
              <button className="action-button" type="button" onClick={() => { dispatch({ type: 'continue' }); setCurrentQuestion(null); }}>{state.lastAnswerCorrect ? 'Далі!' : 'Зрозумів!'}</button>
            </div>}
        </div>
      </div>}
      {state.phase === 'paused' && <div className="game-overlay" role="dialog" aria-modal="true" aria-label="Пауза"><div className="game-result-card"><h2>Перепочинок</h2><button className="action-button" type="button" onClick={() => dispatch({ type: 'resume' })}>Продовжити</button><button className="action-button secondary" type="button" onClick={onMap}>На карту</button></div></div>}
      {(state.phase === 'caught' || state.phase === 'escaped') && <div className="game-overlay" role="dialog" aria-modal="true" aria-label="Результат забігу"><div className="game-result-card">
        <Mascot pose={state.phase === 'escaped' ? 'cheer' : 'oops'} size={120} eager />
        <h2>{state.phase === 'escaped' ? 'Ти вибрався з вольєра!' : 'Ой, динозавр тебе наздогнав! Спробуй ще раз'}</h2>
        <p>Зароблено рубінів: <strong>{state.rubies}</strong>{state.phase === 'escaped' ? ' · бонус за втечу +10' : ''}</p>
        {state.phase === 'caught' ? <button className="action-button" type="button" onClick={retry}>Спробувати ще раз</button> : <Link className="action-button" to={`/g/${context.grade}/${context.subject}`}>До уроків</Link>}
        <button className="action-button secondary" type="button" onClick={onMap}>На карту</button>
      </div></div>}
    </div>
  </div>;
}

export function GamePage() {
  const [params] = useSearchParams();
  const lastContext = useProgress(state => state.lastGameContext);
  const grade = Number(params.get('grade'));
  const explicit = { grade, subject: params.get('subject') ?? '', section: params.get('section') ?? '' };
  const found = contentRegistry.find(item => item.grade === explicit.grade && item.subject === explicit.subject && item.section === explicit.section);
  const fallback = lastContext && contentRegistry.some(item => item.grade === lastContext.grade && item.subject === lastContext.subject && item.section === lastContext.section) ? lastContext : contentRegistry[0];
  const context = found ? explicit : { grade: fallback.grade, subject: fallback.subject, section: fallback.section };
  const [dino, setDino] = useState<DinoId | null>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<Images | null>(null);
  const onRun = async (chosen: DinoId) => { setLoading(true); const loaded = await preloadImages(); setImages(loaded); setDino(chosen); setLoading(false); };
  if (loading) return <div className="jungle-page game-loading" role="status"><Mascot pose="hello" size={110} eager /><p>Готуємо вольєр…</p></div>;
  if (dino && images) return <Runner key={dino} dino={dino} context={context} images={images} onMap={() => setDino(null)} />;
  return <ParkMap context={context} onRun={onRun} />;
}
