import { PlayerColor } from '../types';

export interface GridCoord {
  row: number; // 0..14
  col: number; // 0..14
}

// 52 common track coordinate positions in clockwise order starting from Red start (row 6, col 1)
export const COMMON_TRACK_COORDS: GridCoord[] = [
  // 0..4: Red exit to Green branch
  { row: 6, col: 1 }, // 0: Red Start (Safe)
  { row: 6, col: 2 }, // 1
  { row: 6, col: 3 }, // 2
  { row: 6, col: 4 }, // 3
  { row: 6, col: 5 }, // 4
  // 5..10: Green north arm up
  { row: 5, col: 6 }, // 5
  { row: 4, col: 6 }, // 6
  { row: 3, col: 6 }, // 7
  { row: 2, col: 6 }, // 8: Safe Star
  { row: 1, col: 6 }, // 9
  { row: 0, col: 6 }, // 10
  // 11..12: Green top apex
  { row: 0, col: 7 }, // 11
  { row: 0, col: 8 }, // 12
  // 13..17: Green south arm down
  { row: 1, col: 8 }, // 13: Green Start (Safe)
  { row: 2, col: 8 }, // 14
  { row: 3, col: 8 }, // 15
  { row: 4, col: 8 }, // 16
  { row: 5, col: 8 }, // 17
  // 18..23: Yellow east arm right
  { row: 6, col: 9 }, // 18
  { row: 6, col: 10 }, // 19
  { row: 6, col: 11 }, // 20
  { row: 6, col: 12 }, // 21: Safe Star
  { row: 6, col: 13 }, // 22
  { row: 6, col: 14 }, // 23
  // 24..25: Yellow right apex
  { row: 7, col: 14 }, // 24
  { row: 8, col: 14 }, // 25
  // 26..30: Yellow west arm left
  { row: 8, col: 13 }, // 26: Yellow Start (Safe)
  { row: 8, col: 12 }, // 27
  { row: 8, col: 11 }, // 28
  { row: 8, col: 10 }, // 29
  { row: 8, col: 9 }, // 30
  // 31..36: Blue south arm down
  { row: 9, col: 8 }, // 31
  { row: 10, col: 8 }, // 32
  { row: 11, col: 8 }, // 33
  { row: 12, col: 8 }, // 34: Safe Star
  { row: 13, col: 8 }, // 35
  { row: 14, col: 8 }, // 36
  // 37..38: Blue bottom apex
  { row: 14, col: 7 }, // 37
  { row: 14, col: 6 }, // 38
  // 39..43: Blue north arm up
  { row: 13, col: 6 }, // 39: Blue Start (Safe)
  { row: 12, col: 6 }, // 40
  { row: 11, col: 6 }, // 41
  { row: 10, col: 6 }, // 42
  { row: 9, col: 6 }, // 43
  // 44..49: Red west arm left
  { row: 8, col: 5 }, // 44
  { row: 8, col: 4 }, // 45
  { row: 8, col: 3 }, // 46
  { row: 8, col: 2 }, // 47: Safe Star
  { row: 8, col: 1 }, // 48
  { row: 8, col: 0 }, // 49
  // 50..51: Red left apex
  { row: 7, col: 0 }, // 50 (last common track square before Red enters home)
  { row: 6, col: 0 }, // 51
];

export const START_TRACK_INDEX: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const SAFE_TRACK_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

export const HOME_STRETCH_COORDS: Record<PlayerColor, GridCoord[]> = {
  red: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
  ],
  green: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
  ],
  yellow: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
  ],
  blue: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
  ],
};

export const HOME_CENTER_COORDS: Record<PlayerColor, GridCoord> = {
  red: { row: 7, col: 6 },
  green: { row: 6, col: 7 },
  yellow: { row: 7, col: 8 },
  blue: { row: 8, col: 7 },
};

// Yard slot coordinates (within the 15x15 board)
export const YARD_SLOT_COORDS: Record<PlayerColor, GridCoord[]> = {
  red: [
    { row: 1.5, col: 1.5 },
    { row: 1.5, col: 3.5 },
    { row: 3.5, col: 1.5 },
    { row: 3.5, col: 3.5 },
  ],
  green: [
    { row: 1.5, col: 9.5 },
    { row: 1.5, col: 11.5 },
    { row: 3.5, col: 9.5 },
    { row: 3.5, col: 11.5 },
  ],
  blue: [
    { row: 9.5, col: 1.5 },
    { row: 9.5, col: 3.5 },
    { row: 11.5, col: 1.5 },
    { row: 11.5, col: 3.5 },
  ],
  yellow: [
    { row: 9.5, col: 9.5 },
    { row: 9.5, col: 11.5 },
    { row: 11.5, col: 9.5 },
    { row: 11.5, col: 11.5 },
  ],
};

/**
 * Returns exact (row, col) grid coordinates for any token position
 */
export function getTokenGridPosition(color: PlayerColor, step: number, yardIndex: number): GridCoord {
  if (step === -1) {
    // In Yard
    return YARD_SLOT_COORDS[color][yardIndex] || { row: 0, col: 0 };
  }
  if (step >= 0 && step <= 50) {
    // On common track
    const startIndex = START_TRACK_INDEX[color];
    const absoluteTrackIndex = (startIndex + step) % 52;
    return COMMON_TRACK_COORDS[absoluteTrackIndex];
  }
  if (step >= 51 && step <= 55) {
    // In Home stretch
    const stretchIndex = step - 51;
    return HOME_STRETCH_COORDS[color][stretchIndex];
  }
  // Step 56 = Reached Home Center
  return HOME_CENTER_COORDS[color];
}

/**
 * Helper to check if absolute track index is a safe zone
 */
export function isSafeTrackIndex(trackIndex: number): boolean {
  return SAFE_TRACK_INDICES.includes(trackIndex);
}

/**
 * Color metadata definitions
 */
export const COLOR_CONFIG: Record<
  PlayerColor,
  {
    name: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    accentHex: string;
    gradientHex: string;
    lightHex: string;
    darkHex: string;
  }
> = {
  red: {
    name: 'Red',
    bgClass: 'bg-rose-500',
    textClass: 'text-rose-500',
    borderClass: 'border-rose-500',
    accentHex: '#f43f5e',
    gradientHex: 'from-rose-500 to-red-600',
    lightHex: '#ffe4e6',
    darkHex: '#be123c',
  },
  green: {
    name: 'Green',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-500',
    borderClass: 'border-emerald-500',
    accentHex: '#10b981',
    gradientHex: 'from-emerald-500 to-green-600',
    lightHex: '#d1fae5',
    darkHex: '#047857',
  },
  yellow: {
    name: 'Yellow',
    bgClass: 'bg-amber-400',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-400',
    accentHex: '#f59e0b',
    gradientHex: 'from-amber-400 to-yellow-500',
    lightHex: '#fef3c7',
    darkHex: '#b45309',
  },
  blue: {
    name: 'Blue',
    bgClass: 'bg-sky-500',
    textClass: 'text-sky-500',
    borderClass: 'border-sky-500',
    accentHex: '#0284c7',
    gradientHex: 'from-sky-500 to-blue-600',
    lightHex: '#e0f2fe',
    darkHex: '#0369a1',
  },
};
