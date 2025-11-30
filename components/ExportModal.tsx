import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Grid3X3, AlignLeft, Layers, Download } from 'lucide-react';
import { GridData, PaletteColor, ExportOptions } from '../types';

interface ExportModalProps {
  grid: GridData;
  palette: PaletteColor[];
  onExport: (options: ExportOptions) => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ grid, palette, onExport, onClose }) => {
  const [title, setTitle] = useState('My Tapestry Project');
  const [selectedOption, setSelectedOption] = useState<'all' | 'chart' | 'blocks' | 'written'>('all');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- CHANGED: Generate a thumbnail preview (Cover art only) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rows = grid.length;
    const cols = grid[0].length;
    const size = 5; // Small pixel size for preview

    canvas.width = cols * size;
    canvas.height = rows * size;

    grid.forEach((row, r) => {
      row.forEach((cellId, c) => {
        const color = palette.find(p => p.id === cellId);
        ctx.fillStyle = color?.hex || '#ffffff';
        ctx.fillRect(c * size, r * size, size, size);
      });
    });
  }, [grid, palette]);

  const handleDownload = () => {
    // --- CHANGED: Map selection to specific boolean flags ---
    onExport({
      title,
      includeChart: selectedOption === 'chart' || selectedOption === 'all',
      includeBlocks: selectedOption === 'blocks' || selectedOption === 'all',
      includeWritten: selectedOption === 'written' || selectedOption === 'all',
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dim/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex overflow-hidden border border-white">
        
        {/* Left Side: Preview & Title */}
        <div className="w-1/3 bg-slate-50 p-6 flex flex-col border-r border-slate-100">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">Preview</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
             <canvas ref={canvasRef} className="max-w-full max-h-[200px] object-contain" />
             <p className="text-xs text-slate-400 mt-4 text-center">
               Cover Preview<br/>
               (Full pattern hidden)
             </p>
          </div>

          <div className="space-y-2">
             <label className="text-xs font-bold text-brand-dark uppercase">Project Title</label>
             <input 
               type="text" 
               value={title} 
               onChange={(e) => setTitle(e.target.value)}
               className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:border-brand outline-none"
             />
             <div className="text-xs text-slate-400 font-medium">By Tapestry Buddy</div>
          </div>
        </div>

        {/* Right Side: Options */}
        <div className="flex-1 p-8 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
               <h2 className="text-2xl font-bold text-slate-800">Export Pattern</h2>
               <p className="text-slate-500 text-sm">Choose what to include in your PDF.</p>
            </div>
            <button onClick={onClose}><X className="w-6 h-6 text-slate-400 hover:text-slate-600"/></button>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-8">
             <OptionButton 
               active={selectedOption === 'all'} 
               onClick={() => setSelectedOption('all')}
               icon={<Layers className="w-5 h-5"/>}
               title="Complete Pattern Package"
               desc="Includes Cover, Pixel Chart, Color Blocks, and Written Instructions."
             />
             <OptionButton 
               active={selectedOption === 'chart'} 
               onClick={() => setSelectedOption('chart')}
               icon={<Grid3X3 className="w-5 h-5"/>}
               title="Pixel Chart Only"
               desc="A clear grid view with RS/WS row markers."
             />
             <OptionButton 
               active={selectedOption === 'blocks'} 
               onClick={() => setSelectedOption('blocks')}
               icon={<Grid3X3 className="w-5 h-5"/>} // Reusing grid icon for visual blocks
               title="Color Block Pattern Only"
               desc="Visual color count boxes (e.g., [Blue] 5)."
             />
             <OptionButton 
               active={selectedOption === 'written'} 
               onClick={() => setSelectedOption('written')}
               icon={<AlignLeft className="w-5 h-5"/>}
               title="Written Instructions Only"
               desc="Standard text-based crochet notation."
             />
          </div>

          <div className="mt-auto flex justify-end">
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-8 py-3 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl shadow-lg shadow-brand/20 transition-transform active:scale-95"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OptionButton = ({ active, onClick, icon, title, desc }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
      active 
      ? 'border-brand bg-brand-dim/30 shadow-sm' 
      : 'border-slate-100 hover:border-brand-light hover:bg-slate-50'
    }`}
  >
    <div className={`p-2 rounded-lg ${active ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500'}`}>
      {icon}
    </div>
    <div>
      <h4 className={`font-bold text-sm ${active ? 'text-brand-dark' : 'text-slate-700'}`}>{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </button>
);