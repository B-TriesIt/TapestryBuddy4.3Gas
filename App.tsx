import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Palette as PaletteIcon, Grid3X3, Download, Eye, Plus, Trash2, 
  Undo2, Redo2, HelpCircle, FileText, Image as ImageIcon,
  ZoomIn, ZoomOut, MousePointer2, PaintBucket, Eraser,
  ArrowRight, ArrowLeft, Move, Calculator, Type, ChevronLeft, ChevronRight, Hand
} from 'lucide-react';
import { AppMode, GridData, PaletteColor, ToolType, ExportOptions } from './types';
import { Tooltip } from './components/Tooltip';
import { WorkingMode } from './components/WorkingMode';
import { HelpModal } from './components/HelpModal';
import { ImageImport } from './components/ImageImport';
import { ResizeModal } from './components/ResizeModal';
import { GaugeModal } from './components/GaugeModal';
import { ExportModal } from './components/ExportModal';
import { generatePatternInstructions, generateWrittenInstructions } from './services/patternService';
import { generatePatternPDF } from './services/pdfGenerator';
import { YARN_DATABASE, SYMBOLS } from './data/yarns';

// --- HEADER: Default Configuration ---
const DEFAULT_PALETTE: PaletteColor[] = [
  { id: '1', name: 'Sky Blue', hex: '#8FDAFA', symbol: 'X' },
  { id: '2', name: 'White', hex: '#FFFFFF', symbol: '.' },
  { id: '3', name: 'Charcoal', hex: '#334155', symbol: '#' },
];
const INITIAL_ROWS = 20;
const INITIAL_COLS = 20;

// --- HEADER: Tool Enum Extension ---
// Added 'MOVE' for the Pan tool logic.
enum ExtendedToolType {
  PENCIL = 'PENCIL',
  FILL = 'FILL',
  ERASER = 'ERASER',
  PICKER = 'PICKER',
  MOVE = 'MOVE' 
}

function createEmptyGrid(rows: number, cols: number, fillId: string = '2'): GridData {
  return Array(rows).fill(null).map(() => Array(cols).fill(fillId));
}

const App: React.FC = () => {
  // --- HEADER: State Management ---
  const [mode, setMode] = useState<AppMode>(AppMode.EDITOR);
  const [palette, setPalette] = useState<PaletteColor[]>(DEFAULT_PALETTE);
  const [grid, setGrid] = useState<GridData>(createEmptyGrid(INITIAL_ROWS, INITIAL_COLS, DEFAULT_PALETTE[1].id));
  const [selectedColorId, setSelectedColorId] = useState<string>(DEFAULT_PALETTE[0].id);
  const [selectedTool, setSelectedTool] = useState<ExtendedToolType | ToolType>(ToolType.PENCIL);
  const [scale, setScale] = useState(1);
  
  // Modals
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isResizeOpen, setIsResizeOpen] = useState(false);
  const [isGaugeOpen, setIsGaugeOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  // UI Toggles
  const [showSymbols, setShowSymbols] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  
  // History
  const [history, setHistory] = useState<GridData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // --- HEADER: Interaction Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // For Panning
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false); // Pan state
  const lastPosRef = useRef<{x: number, y: number} | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{x: number, y: number} | null>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const CELL_SIZE = 24;
  const RULER_SIZE = 35; // Increased for visibility

  // --- HEADER: History & Undo/Redo ---
  const saveToHistory = useCallback((newGrid: GridData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newGrid)));
    if (newHistory.length > 20) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setGrid(newGrid);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setGrid(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setGrid(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  useEffect(() => {
    if (history.length === 0) {
      saveToHistory(grid);
    }
  }, []);

  // --- HEADER: Canvas Clearing Logic ---
  const clearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the entire canvas?')) {
        let whiteId = palette.find(p => p.hex.toLowerCase() === '#ffffff')?.id;
        if (!whiteId) whiteId = palette[0].id;
        
        const newGrid = createEmptyGrid(grid.length, grid[0].length, whiteId);
        setGrid(newGrid);
        saveToHistory(newGrid);
    }
  };

  // --- HEADER: Main Render Loop ---
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rows = grid.length;
    const cols = grid[0].length;
    
    // Total Size = Grid + Rulers on ALL sides (Left+Right, Top+Bottom)
    const totalWidth = cols * CELL_SIZE + (RULER_SIZE * 2);
    const totalHeight = rows * CELL_SIZE + (RULER_SIZE * 2);

    canvas.width = totalWidth * scale;
    canvas.height = totalHeight * scale;
    ctx.scale(scale, scale);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // --- Draw Rulers Background ---
    
    // Corners
    ctx.fillStyle = '#6BC4D9'; 
    ctx.fillRect(0, 0, RULER_SIZE, RULER_SIZE); // Top-Left
    ctx.fillRect(totalWidth - RULER_SIZE, 0, RULER_SIZE, RULER_SIZE); // Top-Right
    ctx.fillRect(0, totalHeight - RULER_SIZE, RULER_SIZE, RULER_SIZE); // Bottom-Left
    ctx.fillRect(totalWidth - RULER_SIZE, totalHeight - RULER_SIZE, RULER_SIZE, RULER_SIZE); // Bottom-Right

    // Top Ruler Background
    ctx.fillStyle = '#8FDAFA'; 
    ctx.fillRect(RULER_SIZE, 0, cols * CELL_SIZE, RULER_SIZE);

    // Bottom Ruler Background
    ctx.fillRect(RULER_SIZE, totalHeight - RULER_SIZE, cols * CELL_SIZE, RULER_SIZE);
    
    // Left Ruler Background
    ctx.fillStyle = '#E0F9FF';
    ctx.fillRect(0, RULER_SIZE, RULER_SIZE, rows * CELL_SIZE);

    // Right Ruler Background
    ctx.fillRect(totalWidth - RULER_SIZE, RULER_SIZE, RULER_SIZE, rows * CELL_SIZE);

    // --- Draw Grid Cells ---
    ctx.save();
    ctx.translate(RULER_SIZE, RULER_SIZE);

    grid.forEach((row, r) => {
      row.forEach((cellId, c) => {
        const pColor = palette.find(p => p.id === cellId);
        const color = pColor?.hex || '#fff';
        
        ctx.fillStyle = color;
        ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        if (showSymbols && pColor?.symbol) {
             ctx.fillStyle = getContrastColor(color);
             ctx.font = '12px Arial';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText(pColor.symbol, c * CELL_SIZE + CELL_SIZE/2, r * CELL_SIZE + CELL_SIZE/2);
        }
      });
    });

    if (hoveredCell) {
      const { x, y } = hoveredCell;
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
    ctx.restore();

    // --- Draw Ruler Text ---
    ctx.font = 'bold 11px sans-serif'; // Slightly larger for visibility
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Horizontal Rulers (Top & Bottom)
    for (let c = 0; c < cols; c++) {
      if (scale < 0.5 && (c + 1) % 5 !== 0) continue; 
      
      const centerX = RULER_SIZE + (c * CELL_SIZE) + (CELL_SIZE / 2);
      
      // Top: 1 -> N
      ctx.fillText(`${c + 1}`, centerX, RULER_SIZE / 2);

      // Bottom: N -> 1 (Reversed)
      const bottomNum = cols - c;
      ctx.fillText(`${bottomNum}`, centerX, totalHeight - (RULER_SIZE / 2));
    }

    // Vertical Rulers (Left & Right)
    for (let r = 0; r < rows; r++) {
      if (scale < 0.5 && (rows - r) % 5 !== 0) continue;

      const centerY = RULER_SIZE + (r * CELL_SIZE) + (CELL_SIZE / 2);
      const rowNum = rows - r; 

      // Left: N -> 1 (e.g. 20 down to 1)
      ctx.fillText(`${rowNum}`, RULER_SIZE / 2, centerY);

      // Right: N -> 1 (Identical to Left)
      ctx.fillText(`${rowNum}`, totalWidth - (RULER_SIZE / 2), centerY);
    }
  }, [grid, palette, scale, hoveredCell, showSymbols]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  // --- HEADER: Coordinates & Painting ---
  const getGridCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: -1, y: -1 };
    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / scale;
    const rawY = (e.clientY - rect.top) / scale;
    const x = Math.floor((rawX - RULER_SIZE) / CELL_SIZE);
    const y = Math.floor((rawY - RULER_SIZE) / CELL_SIZE);
    return { x, y };
  };

  const paint = (x: number, y: number, currentGrid: GridData) => {
    if (x >= 0 && x < currentGrid[0].length && y >= 0 && y < currentGrid.length) {
      if (currentGrid[y][x] !== selectedColorId && selectedTool !== ToolType.ERASER) {
        currentGrid[y][x] = selectedColorId;
        return true;
      }
      if (selectedTool === ToolType.ERASER) {
        const whiteId = palette.find(p => p.hex.toLowerCase() === '#ffffff')?.id || '';
        if (currentGrid[y][x] !== whiteId) {
             currentGrid[y][x] = whiteId; 
             return true;
        }
      }
    }
    return false;
  };

  // --- HEADER: Input Event Handlers ---
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === ExtendedToolType.MOVE) return;

    setIsDrawing(true);
    const { x, y } = getGridCoordinates(e);
    
    if (x < 0 || y < 0 || x >= grid[0].length || y >= grid.length) return;

    if (selectedTool === ToolType.FILL) {
      const targetColor = grid[y][x];
      if (targetColor === selectedColorId) return;
      const newGrid = JSON.parse(JSON.stringify(grid));
      floodFill(newGrid, x, y, targetColor, selectedColorId);
      saveToHistory(newGrid);
      setIsDrawing(false); 
    } else if (selectedTool === ToolType.PICKER) {
      const colorId = grid[y][x];
      if (colorId) {
        setSelectedColorId(colorId);
        setSelectedTool(ToolType.PENCIL); 
      }
      setIsDrawing(false);
    } else {
      const newGrid = [...grid.map(row => [...row])];
      paint(x, y, newGrid);
      setGrid(newGrid); 
      lastPosRef.current = { x, y };
    }
  };

  // --- HEADER: Container Pan Handlers ---
  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === ExtendedToolType.MOVE) {
      setIsPanning(true);
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning && lastPosRef.current && containerRef.current) {
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      containerRef.current.scrollTop -= dy;
      containerRef.current.scrollLeft -= dx;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      return; 
    }

    if (e.target === canvasRef.current) {
        const mouseE = e as unknown as React.MouseEvent<HTMLCanvasElement>;
        const { x, y } = getGridCoordinates(mouseE);
        setHoveredCell({ x, y });

        if (isDrawing && (selectedTool === ToolType.PENCIL || selectedTool === ToolType.ERASER)) {
          if (lastPosRef.current) {
            const newGrid = [...grid.map(row => [...row])];
            paint(x, y, newGrid); 
            setGrid(newGrid);
          }
        }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
     if(selectedTool === ExtendedToolType.MOVE) return; 

     const { x, y } = getGridCoordinates(e);
     setHoveredCell({ x, y });

     if (isDrawing && (selectedTool === ToolType.PENCIL || selectedTool === ToolType.ERASER)) {
        const newGrid = [...grid.map(row => [...row])];
        paint(x, y, newGrid); 
        setGrid(newGrid);
     }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (selectedTool === ToolType.PENCIL || selectedTool === ToolType.ERASER) {
        saveToHistory(grid);
      }
    }
    setIsPanning(false);
    lastPosRef.current = null;
  };

  // --- HEADER: Helper Functions ---
  const floodFill = (gridData: GridData, x: number, y: number, target: string, replacement: string) => {
    const stack = [[x, y]];
    const rows = gridData.length;
    const cols = gridData[0].length;
    const visited = new Set<string>();
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      if (gridData[cy][cx] === target) {
        gridData[cy][cx] = replacement;
        visited.add(key);
        [[cx-1, cy], [cx+1, cy], [cx, cy-1], [cx, cy+1]].forEach(([nx, ny]) => {
          if(nx>=0 && nx<cols && ny>=0 && ny<rows) stack.push([nx, ny]);
        });
      }
    }
  };

  // --- HEADER: Palette Actions ---
  const handleAddColorClick = () => {
      if (colorPickerRef.current) colorPickerRef.current.click();
  };

  const addColorFromPicker = (hex: string) => {
    const newId = Date.now().toString();
    const symbol = SYMBOLS[palette.length % SYMBOLS.length];
    const newColor: PaletteColor = { 
        id: newId, 
        name: `Color ${palette.length + 1}`, 
        hex: hex, 
        symbol 
    };
    setPalette([...palette, newColor]);
    setSelectedColorId(newId);
  };

  // --- HEADER: Use Native Change Event (Fix for Spamming) ---
  // We use a useEffect with a native event listener because React's onChange 
  // behaves like onInput (continuous) for color inputs, causing many colors to be added during drag.
  // The native 'change' event only fires on commit (unclick/close).
  useEffect(() => {
    const el = colorPickerRef.current;
    if (!el) return;

    const handler = (e: Event) => {
        const target = e.target as HTMLInputElement;
        addColorFromPicker(target.value);
    };

    el.addEventListener('change', handler);
    return () => {
        el.removeEventListener('change', handler);
    };
  }, [palette]); // Re-bind if palette changes (to ensure closure captures latest if needed, though addColorFromPicker is stable-ish)

  const removeAllColors = () => {
     if(window.confirm("Delete all colors? (This will reset grid to default white)")) {
        const white: PaletteColor = { id: 'default-white', name: 'White', hex: '#FFFFFF', symbol: '.' };
        setPalette([white]);
        setSelectedColorId(white.id);
        setGrid(createEmptyGrid(grid.length, grid[0].length, white.id));
     }
  };

  // --- HEADER: Export & Resize ---
  const handleExport = (options: ExportOptions) => {
     const patternData = generatePatternInstructions(grid, palette);
     const writtenData = generateWrittenInstructions(patternData, palette);
     generatePatternPDF(grid, palette, patternData, writtenData, options);
     setIsExportOpen(false);
  };

  const handleResize = (direction: 'top' | 'bottom' | 'left' | 'right' | 'all', amount: number) => {
    let newGrid = [...grid.map(row => [...row])];
    let whiteId = palette.find(p => p.hex.toLowerCase() === '#ffffff')?.id;
    if (!whiteId) whiteId = palette[0].id;
    const fillId = whiteId; 

    if (direction === 'bottom' || direction === 'all') {
      for (let i = 0; i < amount; i++) newGrid.push(Array(newGrid[0].length).fill(fillId));
    }
    if (direction === 'top' || direction === 'all') {
      for (let i = 0; i < amount; i++) newGrid.unshift(Array(newGrid[0].length).fill(fillId));
    }
    if (direction === 'right' || direction === 'all') {
      newGrid = newGrid.map(row => [...row, ...Array(amount).fill(fillId)]);
    }
    if (direction === 'left' || direction === 'all') {
      newGrid = newGrid.map(row => [...Array(amount).fill(fillId), ...row]);
    }

    saveToHistory(newGrid);
    setIsResizeOpen(false);
  };

  const handleGaugeApply = (rows: number, cols: number) => {
    let whiteId = palette.find(p => p.hex.toLowerCase() === '#ffffff')?.id;
    if (!whiteId) whiteId = palette[0].id;

    const newGrid = createEmptyGrid(rows, cols, whiteId);
    // Preserve existing drawing
    for (let r = 0; r < Math.min(grid.length, rows); r++) {
      for (let c = 0; c < Math.min(grid[0].length, cols); c++) {
        newGrid[r][c] = grid[r][c];
      }
    }
    setGrid(newGrid);
    saveToHistory(newGrid);
    setIsGaugeOpen(false);
  };

  const handleImageImport = (importedGrid: GridData, importedPalette: PaletteColor[]) => {
    setPalette(importedPalette);
    setGrid(importedGrid);
    saveToHistory(importedGrid);
    if (importedPalette.length > 0) {
      setSelectedColorId(importedPalette[0].id);
    }
    setMode(AppMode.EDITOR);
  };

  const resetView = () => {
    setScale(1);
    if(containerRef.current) {
        containerRef.current.scrollTop = 0;
        containerRef.current.scrollLeft = 0;
    }
  };

  // --- RENDER ---
  if (mode === AppMode.WORKING) return <WorkingMode grid={grid} palette={palette} onExit={() => setMode(AppMode.EDITOR)} />;

  const hoveredRow = hoveredCell && hoveredCell.y >= 0 && hoveredCell.y < grid.length ? grid.length - hoveredCell.y : 0;
  const hoveredCol = hoveredCell && hoveredCell.x >= 0 && hoveredCell.x < grid[0].length ? hoveredCell.x + 1 : 0;
  
  return (
    <div className="flex flex-col h-screen text-slate-800 custom-cursor-area">
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm z-20 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center"><Grid3X3 className="text-white w-5 h-5" /></div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Tapestry <span className="text-brand-dark">Buddy</span></h1>
        </div>
        <div className="flex items-center gap-4">
           <Tooltip text="Import image"><button onClick={() => setMode(AppMode.IMAGE_IMPORT)} className="p-2 hover:bg-slate-100 rounded-lg"><ImageIcon className="w-5 h-5 text-slate-600" /></button></Tooltip>
           <Tooltip text="Resize"><button onClick={() => setIsResizeOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg"><Move className="w-5 h-5 text-slate-600" /></button></Tooltip>
           <Tooltip text="Calculator"><button onClick={() => setIsGaugeOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg"><Calculator className="w-5 h-5 text-slate-600" /></button></Tooltip>
           <Tooltip text="Clear Canvas"><button onClick={clearCanvas} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 className="w-5 h-5" /></button></Tooltip>
           <div className="h-6 w-px bg-gray-200"></div>
           <Tooltip text="Export PDF"><button onClick={() => setIsExportOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-brand hover:bg-brand-dark rounded-md shadow-sm"><Download className="w-4 h-4" /> Export</button></Tooltip>
           <Tooltip text="Help"><button onClick={() => setIsHelpOpen(true)} className="p-2 text-slate-400 hover:text-brand-dark"><HelpCircle className="w-6 h-6" /></button></Tooltip>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-6 z-10">
          <Tooltip text="Move Canvas (Pan)" position="right">
            <button onClick={() => setSelectedTool(ExtendedToolType.MOVE)} className={`p-3 rounded-xl transition-all ${selectedTool === ExtendedToolType.MOVE ? 'bg-brand text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>
              <Hand className="w-6 h-6" />
            </button>
          </Tooltip>
          <Tooltip text="Pencil" position="right">
            <button onClick={() => setSelectedTool(ToolType.PENCIL)} className={`p-3 rounded-xl transition-all ${selectedTool === ToolType.PENCIL ? 'bg-brand text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>
              <MousePointer2 className="w-6 h-6" />
            </button>
          </Tooltip>
          <Tooltip text="Fill" position="right">
            <button onClick={() => setSelectedTool(ToolType.FILL)} className={`p-3 rounded-xl transition-all ${selectedTool === ToolType.FILL ? 'bg-brand text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>
              <PaintBucket className="w-6 h-6" />
            </button>
          </Tooltip>
          <Tooltip text="Eraser" position="right">
            <button onClick={() => setSelectedTool(ToolType.ERASER)} className={`p-3 rounded-xl transition-all ${selectedTool === ToolType.ERASER ? 'bg-brand text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>
              <Eraser className="w-6 h-6" />
            </button>
          </Tooltip>
          
          <div className="w-8 h-px bg-gray-200 my-2"></div>
          <Tooltip text="Undo"><button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-slate-400 hover:text-slate-800 disabled:opacity-30"><Undo2 className="w-5 h-5" /></button></Tooltip>
          <Tooltip text="Redo"><button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-slate-400 hover:text-slate-800 disabled:opacity-30"><Redo2 className="w-5 h-5" /></button></Tooltip>
          <div className="flex-1"></div>
          <Tooltip text="Working Mode"><button onClick={() => setMode(AppMode.WORKING)} className="p-3 bg-brand-dim text-brand-dark rounded-xl hover:bg-brand mb-4"><Eye className="w-6 h-6" /></button></Tooltip>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col z-0">
          <div className="h-10 bg-brand-dim border-b border-brand-light flex items-center justify-center px-6 select-none shadow-sm z-10 relative">
            <div className="flex items-center gap-6 text-sm font-bold text-slate-700">
               <span className="flex items-center gap-2">Row <span className="text-brand-dark text-lg">{hoveredRow}</span></span>
               <span className="flex items-center gap-2">Stitch <span className="text-brand-dark text-lg">{hoveredCol}</span></span>
            </div>
            <div className="absolute right-6 flex items-center gap-4">
              <button onClick={resetView} className="text-xs font-bold text-brand-dark hover:underline">Reset View</button>
              <button onClick={() => setShowSymbols(!showSymbols)} className={`text-xs px-2 py-1 rounded ${showSymbols ? 'bg-brand text-white' : 'text-slate-500'}`}><Type className="w-3 h-3 inline mr-1"/> Symbols</button>
              <div className="flex items-center gap-2">
                <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))}><ZoomOut className="w-4 h-4 text-slate-600"/></button>
                <span className="text-xs font-mono w-10 text-center">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(3, s + 0.1))}><ZoomIn className="w-4 h-4 text-slate-600"/></button>
              </div>
            </div>
          </div>

          <div 
            ref={containerRef}
            className={`flex-1 overflow-auto p-8 flex items-center justify-center ${selectedTool === ExtendedToolType.MOVE ? 'cursor-grab active:cursor-grabbing' : 'custom-cursor-area'}`}
            onMouseDown={handleContainerMouseDown}
            onMouseMove={handleContainerMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="bg-white shadow-2xl shadow-slate-200/50 border border-slate-200">
               <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleMouseUp}
                  className="block"
               />
            </div>
          </div>
        </main>

        {/* Palette Panel */}
        <div className={`relative flex flex-col z-20 transition-all duration-300 ease-in-out bg-white border-l border-gray-200 shadow-xl ${isPaletteOpen ? 'w-72' : 'w-0'}`}>
          <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className="absolute -left-6 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-l-lg p-1 text-slate-500 hover:text-brand shadow-md">
            {isPaletteOpen ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
          </button>
          
          <div className={`flex flex-col h-full overflow-hidden ${!isPaletteOpen && 'hidden'}`}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
               <h2 className="font-semibold text-slate-700 flex items-center gap-2"><PaletteIcon className="w-4 h-4 text-brand" /> Color Palette</h2>
               <div className="flex items-center gap-2">
                 <Tooltip text="Pick new color from wheel">
                   <button onClick={handleAddColorClick} className="p-0 rounded-full hover:shadow-md transition-shadow">
                     <div className="w-7 h-7 rounded-full bg-[conic-gradient(red,orange,yellow,green,blue,indigo,violet,red)] border border-slate-200 ring-2 ring-white" />
                   </button>
                 </Tooltip>
                 <input 
                   ref={colorPickerRef}
                   type="color" 
                   className="hidden" 
                   // REMOVED onChange here, handled via useEffect for native commit event
                 />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {palette.map(color => (
                 <div key={color.id} onClick={() => setSelectedColorId(color.id)} className={`group flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${selectedColorId === color.id ? 'border-slate-800 shadow-sm bg-slate-50' : 'border-transparent hover:bg-slate-50 hover:border-slate-200'}`}>
                   <div className="relative shrink-0">
                     <div className="w-8 h-8 rounded-full shadow-sm ring-1 ring-black/10 flex items-center justify-center text-[10px] font-bold text-white/80" style={{ backgroundColor: color.hex }}>
                       {/* Contrast logic inline for brevity */}
                       <span style={{color: parseInt(color.hex.slice(1,3),16)*0.299 + parseInt(color.hex.slice(3,5),16)*0.587 + parseInt(color.hex.slice(5,7),16)*0.114 > 186 ? '#000' : '#fff'}}>{color.symbol}</span>
                     </div>
                   </div>
                   <input 
                      type="text" 
                      value={color.name}
                      onChange={(e) => setPalette(palette.map(p => p.id === color.id ? { ...p, name: e.target.value } : p))}
                      className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                    />
                 </div>
               ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-100 shrink-0">
               <button onClick={removeAllColors} className="w-full py-2 px-3 text-xs font-bold text-red-500 border border-red-200 bg-white hover:bg-red-50 rounded-lg flex items-center justify-center gap-2">
                 <Trash2 className="w-3 h-3" /> Delete All Colors
               </button>
            </div>
          </div>
        </div>
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      {isResizeOpen && <ResizeModal onResize={handleResize} onClose={() => setIsResizeOpen(false)} />}
      {isGaugeOpen && <GaugeModal onApply={handleGaugeApply} onClose={() => setIsGaugeOpen(false)} />}
      {isExportOpen && <ExportModal grid={grid} palette={palette} onExport={handleExport} onClose={() => setIsExportOpen(false)} />}
      {mode === AppMode.IMAGE_IMPORT && <ImageImport palette={palette} onImport={handleImageImport} onCancel={() => setMode(AppMode.EDITOR)} />}
    </div>
  );
};

// --- HEADER: Contrast Helper ---
function getContrastColor(hex: string) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
}

export default App;