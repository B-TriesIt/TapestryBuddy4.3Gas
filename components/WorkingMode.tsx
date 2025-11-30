import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { GridData, PaletteColor } from '../types';

interface WorkingModeProps {
  grid: GridData;
  palette: PaletteColor[];
  onExit: () => void;
}

export const WorkingMode: React.FC<WorkingModeProps> = ({ grid, palette, onExit }) => {
  const [activeRow, setActiveRow] = useState(grid.length - 1); // Start at bottom for crochet
  const [completedRows, setCompletedRows] = useState<number[]>([]);

  const currentRowData = grid[activeRow];

  // Calculate stats for current row
  const rowStats = currentRowData.reduce((acc, cellId) => {
    if (!cellId) return acc;
    acc[cellId] = (acc[cellId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const colorChanges = currentRowData.reduce((count, cellId, idx) => {
    if (idx === 0) return 0;
    return cellId !== currentRowData[idx - 1] ? count + 1 : count;
  }, 0);

  // Compressed view of the row (blocks of color)
  const renderRowBlocks = () => {
    const blocks: { id: string; count: number }[] = [];
    if (currentRowData.length === 0) return null;

    let currentId = currentRowData[0];
    let count = 1;

    for (let i = 1; i < currentRowData.length; i++) {
      if (currentRowData[i] === currentId) {
        count++;
      } else {
        blocks.push({ id: currentId, count });
        currentId = currentRowData[i];
        count = 1;
      }
    }
    blocks.push({ id: currentId, count });

    // Reverse logic if needed for wrong-side rows, but keeping simple L->R for now
    // Tapestry crochet often alternates direction.
    const isEven = (grid.length - 1 - activeRow) % 2 === 0;
    const direction = isEven ? '→ Right to Left (RS)' : '← Left to Right (WS)';

    return (
      <div className="space-y-4">
        <div className="text-center text-slate-500 text-sm font-medium mb-2">{direction}</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {blocks.map((block, idx) => {
             const color = palette.find(p => p.id === block.id);
             return (
               <div key={idx} className="flex flex-col items-center">
                 <div 
                   className="h-16 w-16 rounded-xl shadow-md flex items-center justify-center text-xl font-bold border-2 border-white ring-1 ring-slate-200"
                   style={{ 
                     backgroundColor: color?.hex || 'transparent',
                     color: color ? getContrastColor(color.hex) : '#000'
                   }}
                 >
                   {block.count}
                 </div>
                 <span className="text-xs mt-1 font-medium text-slate-600 max-w-[64px] truncate">
                   {color?.name || 'Empty'}
                 </span>
               </div>
             );
          })}
        </div>
      </div>
    );
  };

  const markComplete = () => {
    if (!completedRows.includes(activeRow)) {
      setCompletedRows([...completedRows, activeRow]);
    }
    if (activeRow > 0) setActiveRow(r => r - 1);
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
        <button 
          onClick={onExit}
          className="flex items-center gap-2 text-slate-600 hover:text-brand-dark transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Exit Mode</span>
        </button>
        <div className="text-xl font-bold text-slate-800">
          Row {grid.length - activeRow} <span className="text-slate-400 text-sm">/ {grid.length}</span>
        </div>
        <div className="w-20"></div> {/* Spacer for balance */}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
        {renderRowBlocks()}

        <div className="mt-8 bg-white p-4 rounded-xl shadow-sm border border-brand-dim w-full max-w-md">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Row Stats</h3>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-brand-dim/30 p-3 rounded-lg">
               <div className="text-2xl font-bold text-brand-dark">{colorChanges}</div>
               <div className="text-xs text-slate-500">Color Changes</div>
             </div>
             <div className="bg-brand-dim/30 p-3 rounded-lg">
               <div className="text-2xl font-bold text-brand-dark">{Object.keys(rowStats).length}</div>
               <div className="text-xs text-slate-500">Colors Used</div>
             </div>
          </div>
        </div>
      </main>

      {/* Controls */}
      <footer className="bg-white border-t border-gray-200 p-6 pb-8">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <button 
            onClick={() => setActiveRow(Math.min(grid.length - 1, activeRow + 1))}
            className="p-4 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all"
            disabled={activeRow >= grid.length - 1}
          >
            <ChevronUp className="w-8 h-8" />
          </button>

          <button 
            onClick={markComplete}
            className="flex-1 bg-brand hover:bg-brand-dark text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg shadow-brand/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-6 h-6" />
            Finish Row
          </button>

          <button 
             onClick={() => setActiveRow(Math.max(0, activeRow - 1))}
             className="p-4 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all"
             disabled={activeRow <= 0}
          >
            <ChevronDown className="w-8 h-8" />
          </button>
        </div>
      </footer>
    </div>
  );
};

// Helper for contrast text
function getContrastColor(hex: string) {
  // Simple YIQ contrast
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
}
