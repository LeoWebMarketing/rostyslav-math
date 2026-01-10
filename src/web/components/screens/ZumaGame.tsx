import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import {
  getPathPoints,
  getPointOnPath,
  moveBalls,
  shootBall,
  updateShooterAngle,
} from '@core/games/zuma/zumaEngine';

const CANVAS_SIZE = 300;
const BALL_RADIUS = 12;

// Colors for balls based on value
const BALL_COLORS: Record<number, string> = {
  1: '#FF6B6B',
  2: '#4ECDC4',
  3: '#FFE66D',
  4: '#95E1D3',
  5: '#F38181',
  6: '#AA96DA',
  7: '#FCBAD3',
  8: '#A8D8EA',
  9: '#FF9A8B',
};

export function ZumaGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const {
    zuma,
    setZumaState,
    setScreen,
    goToStart,
  } = useGameStore();

  // Draw the game
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const { balls, shooter, targetSum, score, level, comboCount } = zuma;

    // Clear canvas
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw path (faded)
    const pathPoints = getPathPoints();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 0, 128, 0.2)';
    ctx.lineWidth = BALL_RADIUS * 2 + 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    pathPoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Draw hole at end (center)
    ctx.beginPath();
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#FF0080';
    ctx.lineWidth = 3;
    ctx.arc(150, 150, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw balls
    balls.forEach((ball) => {
      if (ball.position < 0) return; // Not visible yet

      const pos = getPointOnPath(ball.position);
      const color = BALL_COLORS[ball.value] || '#FFF';

      // Ball glow
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = ball.isMatched ? 20 : 8;
      ctx.arc(pos.x, pos.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ball border
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ball number
      ctx.fillStyle = '#000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ball.value.toString(), pos.x, pos.y);
    });

    // Draw shooter
    const shooterX = 150;
    const shooterY = 150;

    // Shooter base
    ctx.beginPath();
    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = '#00F5D4';
    ctx.lineWidth = 3;
    ctx.arc(shooterX, shooterY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Shooter direction indicator
    const indicatorLength = 35;
    const indicatorX = shooterX + Math.cos(shooter.angle) * indicatorLength;
    const indicatorY = shooterY + Math.sin(shooter.angle) * indicatorLength;

    ctx.beginPath();
    ctx.strokeStyle = '#00F5D4';
    ctx.lineWidth = 3;
    ctx.moveTo(shooterX, shooterY);
    ctx.lineTo(indicatorX, indicatorY);
    ctx.stroke();

    // Current ball in shooter
    const currentBallColor = BALL_COLORS[shooter.currentBall] || '#FFF';
    ctx.beginPath();
    ctx.fillStyle = currentBallColor;
    ctx.shadowColor = currentBallColor;
    ctx.shadowBlur = 10;
    ctx.arc(shooterX, shooterY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(shooter.currentBall.toString(), shooterX, shooterY);

    // Draw UI overlay
    // Target sum
    ctx.fillStyle = '#FF0080';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Ціль: ${targetSum}`, 10, 25);

    // Score
    ctx.fillStyle = '#00F5D4';
    ctx.textAlign = 'right';
    ctx.fillText(`${score}`, CANVAS_SIZE - 10, 25);

    // Level
    ctx.fillStyle = '#FFE66D';
    ctx.textAlign = 'center';
    ctx.fillText(`Рівень ${level}`, CANVAS_SIZE / 2, 25);

    // Combo indicator
    if (comboCount > 1) {
      ctx.fillStyle = '#FF0080';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`x${comboCount} COMBO!`, CANVAS_SIZE / 2, CANVAS_SIZE - 20);
    }

    // Next ball preview
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Далі:', 10, CANVAS_SIZE - 25);

    const nextBallColor = BALL_COLORS[shooter.nextBall] || '#FFF';
    ctx.beginPath();
    ctx.fillStyle = nextBallColor;
    ctx.arc(55, CANVAS_SIZE - 25, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(shooter.nextBall.toString(), 55, CANVAS_SIZE - 25);
  }, [zuma]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Calculate delta time (capped to prevent large jumps)
    const deltaTime = Math.min(timestamp - lastTimeRef.current, 100);
    lastTimeRef.current = timestamp;

    // Update game state
    if (!zuma.isPaused && !zuma.completed && !zuma.failed) {
      const newState = moveBalls(zuma, deltaTime / 1000);
      if (newState !== zuma) {
        setZumaState(newState);

        // Check for game end
        if (newState.completed || newState.failed) {
          setTimeout(() => setScreen('zumaResult'), 500);
          return;
        }
      }
    }

    // Draw
    draw(ctx);

    // Continue loop
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [zuma, draw, setZumaState, setScreen]);

  // Start game loop
  useEffect(() => {
    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  // Get canvas coordinates from event
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Handle pointer move (aim)
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const newState = updateShooterAngle(zuma, coords.x, coords.y);
    setZumaState(newState);
  }, [zuma, getCanvasCoords, setZumaState]);

  // Handle click/tap (shoot)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (zuma.completed || zuma.failed) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);
    const result = shootBall(zuma, coords.x, coords.y);
    setZumaState(result.newState);
  }, [zuma, getCanvasCoords, setZumaState]);

  return (
    <div className="flex flex-col h-full bg-dark">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={goToStart}
          className="text-pink text-2xl"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-pink">Zuma Математика</h1>
        <div className="w-8" />
      </div>

      {/* Instructions */}
      <div className="text-center text-gray-400 text-sm px-4 mb-2">
        Стріляй кульками, щоб сума = {zuma.targetSum}
      </div>

      {/* Game Canvas */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4"
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="border-2 border-pink rounded-lg max-w-full max-h-full"
          style={{
            aspectRatio: '1 / 1',
            touchAction: 'none',
          }}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
        />
      </div>

      {/* Bottom stats */}
      <div className="p-4 text-center">
        <div className="text-gray-400 text-sm">
          3+ кульки з сумою {zuma.targetSum} = очки!
        </div>
      </div>
    </div>
  );
}
