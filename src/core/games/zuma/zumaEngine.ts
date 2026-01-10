import type { ZumaBall, ZumaState, ZumaShooter } from '@core/types';

// Path configuration - S-curve from top-left to bottom-right
const PATH_POINTS = generateSpiralPath();

function generateSpiralPath(): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const centerX = 150;
  const centerY = 150;
  const startRadius = 130;
  const endRadius = 40;
  const totalTurns = 2.5;
  const pointsCount = 200;

  for (let i = 0; i <= pointsCount; i++) {
    const t = i / pointsCount;
    const angle = t * totalTurns * Math.PI * 2 - Math.PI / 2;
    const radius = startRadius - (startRadius - endRadius) * t;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    points.push({ x, y });
  }

  return points;
}

export function getPathPoints() {
  return PATH_POINTS;
}

export function getPointOnPath(position: number): { x: number; y: number } {
  const index = Math.min(
    Math.floor(position * (PATH_POINTS.length - 1)),
    PATH_POINTS.length - 1
  );
  return PATH_POINTS[Math.max(0, index)];
}

export function getAngleOnPath(position: number): number {
  const idx = Math.floor(position * (PATH_POINTS.length - 1));
  const p1 = PATH_POINTS[Math.max(0, idx)];
  const p2 = PATH_POINTS[Math.min(idx + 1, PATH_POINTS.length - 1)];
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

let ballIdCounter = 0;

export function generateRandomBallValue(targetSum: number): number {
  // Generate values that can form the target sum
  const maxValue = Math.min(targetSum - 2, 9);
  return Math.floor(Math.random() * maxValue) + 1;
}

export function createInitialBalls(count: number, targetSum: number): ZumaBall[] {
  const balls: ZumaBall[] = [];
  const spacing = 0.04; // Space between balls

  for (let i = 0; i < count; i++) {
    balls.push({
      id: ballIdCounter++,
      value: generateRandomBallValue(targetSum),
      position: -i * spacing, // Start off-screen, will move in
      isMatched: false,
      isRemoving: false,
    });
  }

  return balls;
}

export function createShooter(targetSum: number): ZumaShooter {
  return {
    angle: -Math.PI / 2, // Point up initially
    currentBall: generateRandomBallValue(targetSum),
    nextBall: generateRandomBallValue(targetSum),
  };
}

export function createZumaState(level: number = 1): ZumaState {
  const targetSum = 10 + (level - 1) * 2; // 10, 12, 14...
  const ballCount = 15 + level * 5; // 20, 25, 30...
  const speed = 0.008 + level * 0.002; // Faster each level

  return {
    balls: createInitialBalls(ballCount, targetSum),
    shooter: createShooter(targetSum),
    targetSum,
    score: 0,
    level,
    speed,
    completed: false,
    failed: false,
    isPaused: false,
    comboCount: 0,
    lastMatchTime: 0,
  };
}

export function moveBalls(state: ZumaState, deltaTime: number): ZumaState {
  if (state.isPaused || state.completed || state.failed) return state;

  const newBalls = state.balls
    .filter((b) => !b.isRemoving)
    .map((ball) => ({
      ...ball,
      position: ball.position + state.speed * deltaTime,
    }));

  // Check if any ball reached the end
  const failed = newBalls.some((b) => b.position >= 1);

  // Check if all balls cleared
  const completed = newBalls.length === 0;

  return {
    ...state,
    balls: newBalls,
    failed,
    completed,
  };
}

export function findInsertionIndex(
  balls: ZumaBall[],
  targetPosition: number
): number {
  for (let i = 0; i < balls.length; i++) {
    if (balls[i].position > targetPosition) {
      return i;
    }
  }
  return balls.length;
}

export function shootBall(
  state: ZumaState,
  targetX: number,
  targetY: number
): { newState: ZumaState; hitPosition: number | null } {
  if (state.completed || state.failed) {
    return { newState: state, hitPosition: null };
  }

  // Find where the shot intersects with any ball
  const shooterPos = { x: 150, y: 150 }; // Center
  const angle = Math.atan2(targetY - shooterPos.y, targetX - shooterPos.x);

  // Find closest ball to the shooting line
  let closestBall: ZumaBall | null = null;
  let closestDist = Infinity;
  let insertBefore = true;

  for (const ball of state.balls) {
    if (ball.position < 0) continue; // Ball not visible yet

    const ballPos = getPointOnPath(ball.position);

    // Check if ball is roughly in the direction we're shooting
    const toBall = Math.atan2(ballPos.y - shooterPos.y, ballPos.x - shooterPos.x);
    const angleDiff = Math.abs(normalizeAngle(toBall - angle));

    if (angleDiff < Math.PI / 6) { // Within 30 degrees
      const dist = Math.hypot(ballPos.x - shooterPos.x, ballPos.y - shooterPos.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestBall = ball;

        // Determine if we insert before or after based on angle
        const pathAngle = getAngleOnPath(ball.position);
        const shootDir = { x: Math.cos(angle), y: Math.sin(angle) };
        const pathDir = { x: Math.cos(pathAngle), y: Math.sin(pathAngle) };
        insertBefore = shootDir.x * pathDir.x + shootDir.y * pathDir.y < 0;
      }
    }
  }

  if (!closestBall) {
    return { newState: state, hitPosition: null };
  }

  // Create new ball
  const newBall: ZumaBall = {
    id: ballIdCounter++,
    value: state.shooter.currentBall,
    position: closestBall.position + (insertBefore ? -0.02 : 0.02),
    isMatched: false,
    isRemoving: false,
  };

  // Insert ball into chain
  const newBalls = [...state.balls];
  const insertIdx = findInsertionIndex(newBalls, newBall.position);
  newBalls.splice(insertIdx, 0, newBall);

  // Push balls apart to make room
  const spacing = 0.04;
  for (let i = insertIdx + 1; i < newBalls.length; i++) {
    const minPos = newBalls[i - 1].position + spacing;
    if (newBalls[i].position < minPos) {
      newBalls[i] = { ...newBalls[i], position: minPos };
    }
  }

  // Check for matches
  const { balls: matchedBalls, matched, score } = checkMatches(
    newBalls,
    state.targetSum,
    insertIdx
  );

  // Update shooter
  const newShooter: ZumaShooter = {
    angle: state.shooter.angle,
    currentBall: state.shooter.nextBall,
    nextBall: generateRandomBallValue(state.targetSum),
  };

  // Combo logic
  const now = Date.now();
  const comboCount = matched && now - state.lastMatchTime < 2000
    ? state.comboCount + 1
    : matched ? 1 : 0;

  return {
    newState: {
      ...state,
      balls: matchedBalls,
      shooter: newShooter,
      score: state.score + score * (1 + comboCount * 0.5),
      comboCount,
      lastMatchTime: matched ? now : state.lastMatchTime,
      completed: matchedBalls.filter(b => !b.isRemoving).length === 0,
    },
    hitPosition: closestBall.position,
  };
}

function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function checkMatches(
  balls: ZumaBall[],
  targetSum: number,
  startIdx: number
): { balls: ZumaBall[]; matched: boolean; score: number } {
  // Look for 3+ consecutive balls that sum to target
  let matched = false;
  let score = 0;
  const newBalls = [...balls];

  // Check around the insertion point
  for (let windowStart = Math.max(0, startIdx - 2); windowStart <= Math.min(startIdx, balls.length - 3); windowStart++) {
    // Try windows of size 3, 4, 5
    for (let windowSize = 3; windowSize <= Math.min(5, balls.length - windowStart); windowSize++) {
      let sum = 0;
      for (let i = 0; i < windowSize; i++) {
        sum += newBalls[windowStart + i].value;
      }

      if (sum === targetSum) {
        // Mark balls as matched
        for (let i = 0; i < windowSize; i++) {
          newBalls[windowStart + i] = {
            ...newBalls[windowStart + i],
            isMatched: true,
            isRemoving: true,
          };
        }
        matched = true;
        score += windowSize * 10;
        break;
      }
    }
    if (matched) break;
  }

  // Remove matched balls
  const filteredBalls = newBalls.filter((b) => !b.isRemoving);

  return { balls: filteredBalls, matched, score };
}

export function updateShooterAngle(state: ZumaState, targetX: number, targetY: number): ZumaState {
  const shooterPos = { x: 150, y: 150 };
  const angle = Math.atan2(targetY - shooterPos.y, targetX - shooterPos.x);

  return {
    ...state,
    shooter: {
      ...state.shooter,
      angle,
    },
  };
}
