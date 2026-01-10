import { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import { Button } from '@web/components/ui/Button';
import { vibrateWrong, vibrateFail } from '@core/utils/vibration';

const CANVAS_SIZE = 300;

export function DalgonaGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [needlePos, setNeedlePos] = useState({ x: 0, y: 0, visible: false });
  const [needleState, setNeedleState] = useState<'normal' | 'on-path' | 'off-path'>('normal');

  const {
    dalgona,
    startDalgonaDrawing,
    updateDalgonaDrawing,
    endDalgonaDrawing,
    restartDalgona,
    startDalgona,
    goToStart,
  } = useGameStore();

  const { shape, path, traced, lives, progress, isDrawing, completed, failed } = dalgona;

  // Draw the dalgona cookie
  const drawDalgona = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Cookie background
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CANVAS_SIZE / 2);
    gradient.addColorStop(0, '#e8c896');
    gradient.addColorStop(0.7, '#d4a574');
    gradient.addColorStop(1, '#b8956a');

    ctx.beginPath();
    ctx.arc(cx, cy, CANVAS_SIZE / 2 - 5, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Cookie texture
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * CANVAS_SIZE;
      const y = Math.random() * CANVAS_SIZE;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < CANVAS_SIZE / 2 - 10) {
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2);
        ctx.fillStyle = '#8B4513';
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Draw shape outline
    if (path.length > 0) {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = '#5c4033';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw traced path
      if (traced.length > 1) {
        ctx.beginPath();
        ctx.moveTo(traced[0].x, traced[0].y);
        for (let i = 1; i < traced.length; i++) {
          ctx.lineTo(traced[i].x, traced[i].y);
        }
        ctx.strokeStyle = '#00F5D4';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#00F5D4';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw start point indicator
      if (!isDrawing && progress < 5) {
        const startPoint = path[0];
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 245, 212, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#00F5D4';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pulsing animation
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, 20 + Math.sin(Date.now() / 200) * 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 245, 212, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Failed overlay
    if (failed) {
      ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }
  }, [path, traced, isDrawing, progress, failed]);

  useEffect(() => {
    drawDalgona();

    // Animate start point
    if (!isDrawing && progress < 5 && !completed && !failed) {
      const interval = setInterval(drawDalgona, 50);
      return () => clearInterval(interval);
    }
  }, [drawDalgona, isDrawing, progress, completed, failed]);

  // Get point from event
  const getPoint = useCallback((e: TouchEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return null;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      screenX: clientX,
      screenY: clientY,
    };
  }, []);

  // Native event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleStart = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      if (completed || failed) return;

      const point = getPoint(e);
      if (point) {
        setNeedlePos({ x: point.screenX, y: point.screenY, visible: true });
        startDalgonaDrawing({ x: point.x, y: point.y });
      }
    };

    const handleMove = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();

      const point = getPoint(e);
      if (point) {
        setNeedlePos({ x: point.screenX, y: point.screenY, visible: true });

        if (isDrawing && !completed && !failed) {
          updateDalgonaDrawing({ x: point.x, y: point.y });
        }
      }
    };

    const handleEnd = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      setNeedlePos(prev => ({ ...prev, visible: false }));
      endDalgonaDrawing();
    };

    // Add event listeners with passive: false for touch events
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleEnd, { passive: false });

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
      canvas.removeEventListener('touchcancel', handleEnd);

      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('mouseleave', handleEnd);
    };
  }, [getPoint, isDrawing, completed, failed, startDalgonaDrawing, updateDalgonaDrawing, endDalgonaDrawing]);

  // Update needle state based on drawing status
  useEffect(() => {
    if (!isDrawing) {
      setNeedleState('normal');
    } else if (lives < 3) {
      setNeedleState('off-path');
    } else {
      setNeedleState('on-path');
    }
  }, [isDrawing, lives]);

  // Track previous lives for vibration
  const prevLivesRef = useRef(lives);
  useEffect(() => {
    if (lives < prevLivesRef.current) {
      // Lost a life - vibrate
      vibrateWrong();
    }
    prevLivesRef.current = lives;
  }, [lives]);

  // Vibrate on game fail
  useEffect(() => {
    if (failed) {
      vibrateFail();
    }
  }, [failed]);

  // Progress ring calculation
  const circumference = 2 * Math.PI * 155;
  const progressOffset = circumference - (progress / 100) * circumference;

  const getStatus = () => {
    if (completed) return 'won';
    if (failed) return 'lost';
    return 'playing';
  };

  const status = getStatus();

  return (
    <div className="screen-fade-in flex flex-col items-center flex-grow px-5 py-6" ref={containerRef}>
      {/* Needle cursor */}
      {needlePos.visible && (
        <div
          className={`needle-cursor ${needleState}`}
          style={{
            left: needlePos.x,
            top: needlePos.y,
          }}
        />
      )}

      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-caramel mb-1" style={{ textShadow: '0 0 15px rgba(212, 165, 116, 0.5)' }}>
          🍪 Dalgona
        </h2>
        <p className="text-teal">{shape?.name || 'Фігура'}</p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-8 mb-4">
        <div className="text-center">
          <div className="text-sm text-gray-400">Прогрес</div>
          <div className="text-xl font-bold text-teal">{Math.round(progress)}%</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">Життя</div>
          <div className="flex gap-1 justify-center">
            {[1, 2, 3].map((i) => (
              <span key={i} className={`text-xl transition-all ${i > lives ? 'opacity-30 scale-75' : 'animate-pulse'}`}>
                {i > lives ? '🖤' : '❤️'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="relative mb-4">
        {/* Progress Ring */}
        <svg className="absolute -top-3 -left-3 w-[320px] h-[320px]" viewBox="0 0 320 320">
          <circle className="fill-none stroke-gray stroke-[4]" cx="160" cy="160" r="155" />
          <circle
            className="fill-none stroke-teal stroke-[4] transition-all duration-300"
            cx="160"
            cy="160"
            r="155"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              filter: 'drop-shadow(0 0 10px rgba(0, 245, 212, 0.5))',
            }}
          />
        </svg>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="rounded-full cursor-none select-none"
          style={{
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 -5px 20px rgba(0, 0, 0, 0.3), 0 0 60px rgba(212, 165, 116, 0.3)',
            touchAction: 'none',
          }}
        />

        {/* Result Overlay */}
        {(completed || failed) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark/90 rounded-full">
            <div className="result-icon text-7xl">
              {completed ? '🎉' : '💔'}
            </div>
            <div className={`text-xl font-bold mt-2 ${completed ? 'text-green' : 'text-red'}`}>
              {completed ? 'Успіх!' : 'Зламалось!'}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <p className="text-center text-teal text-sm mb-6 bg-dark p-3 rounded-xl border border-gray">
        {status === 'playing'
          ? '👆 Проведи пальцем по контуру фігури!'
          : status === 'won'
          ? '🏆 Чудова робота!'
          : '😢 Спробуй ще раз!'}
      </p>

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button variant="primary" onClick={restartDalgona}>
          🔄 Спробувати ще
        </Button>
        <Button variant="secondary" onClick={() => startDalgona()}>
          🎲 Інша фігура
        </Button>
        <Button variant="next" onClick={goToStart} className="!animate-none">
          ← На головну
        </Button>
      </div>
    </div>
  );
}
