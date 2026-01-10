import type { Shape, Point, PathCheck, DalgonaState } from '@core/types';

/**
 * All available shapes for Dalgona game
 */
export const SHAPES: Shape[] = [
  {
    id: 'circle',
    name: 'Коло',
    icon: '⭕',
    difficulty: 1,
    getPath: (cx, cy, r) => {
      const points: Point[] = [];
      for (let i = 0; i <= 360; i += 5) {
        const rad = i * Math.PI / 180;
        points.push({ x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r });
      }
      return points;
    }
  },
  {
    id: 'triangle',
    name: 'Трикутник',
    icon: '△',
    difficulty: 1,
    getPath: (cx, cy, r) => {
      const points: Point[] = [];
      const vertices = [
        { x: cx, y: cy - r },
        { x: cx + r * 0.866, y: cy + r * 0.5 },
        { x: cx - r * 0.866, y: cy + r * 0.5 }
      ];
      for (let i = 0; i < 3; i++) {
        const start = vertices[i];
        const end = vertices[(i + 1) % 3];
        for (let t = 0; t <= 1; t += 0.05) {
          points.push({
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t
          });
        }
      }
      return points;
    }
  },
  {
    id: 'square',
    name: 'Квадрат',
    icon: '⬜',
    difficulty: 1,
    getPath: (cx, cy, r) => {
      const points: Point[] = [];
      const half = r * 0.7;
      const vertices = [
        { x: cx - half, y: cy - half },
        { x: cx + half, y: cy - half },
        { x: cx + half, y: cy + half },
        { x: cx - half, y: cy + half }
      ];
      for (let i = 0; i < 4; i++) {
        const start = vertices[i];
        const end = vertices[(i + 1) % 4];
        for (let t = 0; t <= 1; t += 0.05) {
          points.push({
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t
          });
        }
      }
      return points;
    }
  },
  {
    id: 'diamond',
    name: 'Ромб',
    icon: '◇',
    difficulty: 2,
    getPath: (cx, cy, r) => {
      const points: Point[] = [];
      const vertices = [
        { x: cx, y: cy - r },
        { x: cx + r * 0.6, y: cy },
        { x: cx, y: cy + r },
        { x: cx - r * 0.6, y: cy }
      ];
      for (let i = 0; i < 4; i++) {
        const start = vertices[i];
        const end = vertices[(i + 1) % 4];
        for (let t = 0; t <= 1; t += 0.05) {
          points.push({
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t
          });
        }
      }
      return points;
    }
  },
  {
    id: 'star5',
    name: 'Зірка',
    icon: '⭐',
    difficulty: 2,
    getPath: (cx, cy, r) => {
      const points: Point[] = [];
      const outerR = r;
      const innerR = r * 0.4;
      const vertices: Point[] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i * 36 - 90) * Math.PI / 180;
        const radius = i % 2 === 0 ? outerR : innerR;
        vertices.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
      }
      for (let i = 0; i < 10; i++) {
        const start = vertices[i];
        const end = vertices[(i + 1) % 10];
        for (let t = 0; t <= 1; t += 0.1) {
          points.push({
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t
          });
        }
      }
      return points;
    }
  },
  {
    id: 'heart',
    name: 'Серце',
    icon: '❤️',
    difficulty: 2,
    getPath: (cx, cy, r) => {
      const points: Point[] = [];
      for (let t = 0; t <= 2 * Math.PI; t += 0.1) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
        points.push({ x: cx + x * r / 18, y: cy + y * r / 18 });
      }
      return points;
    }
  },
  {
    id: 'hexagon',
    name: 'Шестикутник',
    icon: '⬡',
    difficulty: 2,
    getPath: (cx, cy, r) => {
      const points: Point[] = [];
      const vertices: Point[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * Math.PI / 180;
        vertices.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
      }
      for (let i = 0; i < 6; i++) {
        const start = vertices[i];
        const end = vertices[(i + 1) % 6];
        for (let t = 0; t <= 1; t += 0.08) {
          points.push({
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t
          });
        }
      }
      return points;
    }
  },
  {
    id: 'tree',
    name: 'Ялинка',
    icon: '🎄',
    difficulty: 3,
    getPath: (cx, cy, r) => {
      const points: Point[] = [];
      const vertices = [
        { x: cx, y: cy - r },
        { x: cx + r * 0.3, y: cy - r * 0.4 },
        { x: cx + r * 0.15, y: cy - r * 0.4 },
        { x: cx + r * 0.5, y: cy + r * 0.1 },
        { x: cx + r * 0.25, y: cy + r * 0.1 },
        { x: cx + r * 0.7, y: cy + r * 0.6 },
        { x: cx + r * 0.15, y: cy + r * 0.6 },
        { x: cx + r * 0.15, y: cy + r },
        { x: cx - r * 0.15, y: cy + r },
        { x: cx - r * 0.15, y: cy + r * 0.6 },
        { x: cx - r * 0.7, y: cy + r * 0.6 },
        { x: cx - r * 0.25, y: cy + r * 0.1 },
        { x: cx - r * 0.5, y: cy + r * 0.1 },
        { x: cx - r * 0.15, y: cy - r * 0.4 },
        { x: cx - r * 0.3, y: cy - r * 0.4 }
      ];
      for (let i = 0; i < vertices.length; i++) {
        const start = vertices[i];
        const end = vertices[(i + 1) % vertices.length];
        for (let t = 0; t <= 1; t += 0.1) {
          points.push({
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t
          });
        }
      }
      return points;
    }
  },
  {
    id: 'pentagon',
    name: 'П\'ятикутник',
    icon: '⬠',
    difficulty: 2,
    getPath: (cx, cy, r) => {
      const points: Point[] = [];
      const vertices: Point[] = [];
      // 5 vertices of pentagon
      for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180;
        vertices.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
      }
      // Create path along edges
      for (let i = 0; i < 5; i++) {
        const start = vertices[i];
        const end = vertices[(i + 1) % 5];
        for (let t = 0; t <= 1; t += 0.08) {
          points.push({
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t
          });
        }
      }
      return points;
    }
  },
  {
    id: 'cross',
    name: 'Хрест',
    icon: '✚',
    difficulty: 2,
    getPath: (cx, cy, r) => {
      const points: Point[] = [];
      const w = r * 0.3;
      const vertices = [
        { x: cx - w, y: cy - r },
        { x: cx + w, y: cy - r },
        { x: cx + w, y: cy - w },
        { x: cx + r, y: cy - w },
        { x: cx + r, y: cy + w },
        { x: cx + w, y: cy + w },
        { x: cx + w, y: cy + r },
        { x: cx - w, y: cy + r },
        { x: cx - w, y: cy + w },
        { x: cx - r, y: cy + w },
        { x: cx - r, y: cy - w },
        { x: cx - w, y: cy - w }
      ];
      for (let i = 0; i < vertices.length; i++) {
        const start = vertices[i];
        const end = vertices[(i + 1) % vertices.length];
        for (let t = 0; t <= 1; t += 0.1) {
          points.push({
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t
          });
        }
      }
      return points;
    }
  },
  {
    id: 'house',
    name: 'Будинок',
    icon: '🏠',
    difficulty: 3,
    getPath: (cx, cy, r) => {
      const points: Point[] = [];
      const vertices = [
        { x: cx, y: cy - r },
        { x: cx + r * 0.8, y: cy - r * 0.2 },
        { x: cx + r * 0.8, y: cy + r },
        { x: cx + r * 0.2, y: cy + r },
        { x: cx + r * 0.2, y: cy + r * 0.3 },
        { x: cx - r * 0.2, y: cy + r * 0.3 },
        { x: cx - r * 0.2, y: cy + r },
        { x: cx - r * 0.8, y: cy + r },
        { x: cx - r * 0.8, y: cy - r * 0.2 }
      ];
      for (let i = 0; i < vertices.length; i++) {
        const start = vertices[i];
        const end = vertices[(i + 1) % vertices.length];
        for (let t = 0; t <= 1; t += 0.1) {
          points.push({
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t
          });
        }
      }
      return points;
    }
  }
];

/**
 * Get a random shape
 */
export function getRandomShape(): Shape {
  return SHAPES[Math.floor(Math.random() * SHAPES.length)];
}

/**
 * Get shape by ID
 */
export function getShapeById(id: string): Shape | undefined {
  return SHAPES.find(s => s.id === id);
}

/**
 * Calculate tolerance based on difficulty
 */
export function getTolerance(difficulty: 1 | 2 | 3): number {
  return 40 - difficulty * 3; // 37, 34, 31
}

/**
 * Check if point is on path
 */
export function isOnPath(
  point: Point,
  path: Point[],
  currentIndex: number,
  tolerance: number
): PathCheck {
  let minDist = Infinity;
  let closestIndex = currentIndex;

  const checkRange = Math.min(path.length, currentIndex + 30);
  for (let i = currentIndex; i < checkRange; i++) {
    const pathPoint = path[i];
    const dist = Math.sqrt(
      Math.pow(point.x - pathPoint.x, 2) + Math.pow(point.y - pathPoint.y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closestIndex = i;
    }
  }

  return {
    onPath: minDist <= tolerance,
    distance: minDist,
    index: closestIndex
  };
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(currentIndex: number, totalPoints: number): number {
  return Math.floor((currentIndex / totalPoints) * 100);
}

/**
 * Check if near start point
 */
export function isNearStartPoint(
  point: Point,
  path: Point[],
  tolerance: number
): boolean {
  if (path.length === 0) return false;
  const startPoint = path[0];
  const dist = Math.sqrt(
    Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2)
  );
  return dist <= tolerance * 1.5;
}

/**
 * Create initial Dalgona state
 */
export function createDalgonaState(shape: Shape, canvasSize: number): DalgonaState {
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;
  const r = canvasSize * 0.35;

  return {
    shape,
    path: shape.getPath(cx, cy, r),
    traced: [],
    lives: 3,
    progress: 0,
    isDrawing: false,
    currentIndex: 0,
    completed: false,
    failed: false,
    tolerance: getTolerance(shape.difficulty)
  };
}
