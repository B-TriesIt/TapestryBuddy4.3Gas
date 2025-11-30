export interface PaletteColor {
  id: string;
  name: string;
  hex: string;
  symbol?: string; // Character for accessibility/B&W charts
}

export interface GridDimensions {
  rows: number;
  cols: number;
}

export type GridData = string[][]; // 2D array storing PaletteColor IDs

export enum ToolType {
  PENCIL = 'PENCIL',
  FILL = 'FILL',
  ERASER = 'ERASER',
  PICKER = 'PICKER'
}

export enum AppMode {
  EDITOR = 'EDITOR',
  WORKING = 'WORKING',
  IMAGE_IMPORT = 'IMAGE_IMPORT'
}

export interface HistoryState {
  grid: GridData;
  timestamp: number;
}

// --- CHANGED: Added ExportOptions interface for the new modal ---
export interface ExportOptions {
  title: string;
  includeChart: boolean;
  includeBlocks: boolean;
  includeWritten: boolean;
}