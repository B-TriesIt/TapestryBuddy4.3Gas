import React, { useState } from 'react';
import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Maximize, Move } from 'lucide-react';

interface ResizeModalProps {
  onResize: (direction: 'top' | 'bottom' | 'left' | 'right' | 'all', amount: number) => void;
  onClose: () => void;
}

export const ResizeModal: React.FC<ResizeModalProps> = ({ onResize, onClose }) => {
  const [amount, setAmount] = useState(1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dim/40 backdrop-blur-sm p-4">
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl max-w-sm w-full p-8 border border-white">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
             <div className="p-2 bg-brand rounded-lg text-white">
               <Move className="w-5 h-5" /> 
            </div>
            Resize Canvas
          </h2>
          <button onClick={onClose}><X className="w-6 h-6 text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="flex flex-col items-center gap-3 mb-8">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Rows/Cols to Add</label>
           <div className="bg-white rounded-2xl shadow-lg shadow-slate-100 border border-slate-100 overflow-hidden w-28 hover:border-brand transition-colors p-1">
             <input 
               type="number" 
               min="1" 
               max="50" 
               value={amount} 
               onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
               className="w-full p-2 text-center font-bold text-2xl text-brand-dark outline-none bg-transparent"
             />
           </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="col-start-2">
                <button onClick={() => onResize('top', amount)} className="w-full aspect-square bg-white border-2 border-slate-100 hover:border-brand hover:text-brand rounded-xl flex flex-col items-center justify-center gap-1 transition-all shadow-sm hover:-translate-y-1">
                    <ArrowUp className="w-6 h-6" /> <span className="text-[10px] font-bold uppercase">Top</span>
                </button>
            </div>
            <div className="col-start-1 row-start-2">
                 <button onClick={() => onResize('left', amount)} className="w-full aspect-square bg-white border-2 border-slate-100 hover:border-brand hover:text-brand rounded-xl flex flex-col items-center justify-center gap-1 transition-all shadow-sm hover:-translate-x-1">
                    <ArrowLeft className="w-6 h-6" /> <span className="text-[10px] font-bold uppercase">Left</span>
                </button>
            </div>
            <div className="col-start-2 row-start-2">
                 <button onClick={() => onResize('all', amount)} className="w-full aspect-square bg-brand text-white shadow-lg shadow-brand/30 hover:bg-brand-dark rounded-xl flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95">
                    <Maximize className="w-6 h-6" /> <span className="text-[10px] font-bold uppercase">All</span>
                </button>
            </div>
             <div className="col-start-3 row-start-2">
                 <button onClick={() => onResize('right', amount)} className="w-full aspect-square bg-white border-2 border-slate-100 hover:border-brand hover:text-brand rounded-xl flex flex-col items-center justify-center gap-1 transition-all shadow-sm hover:translate-x-1">
                    <ArrowRight className="w-6 h-6" /> <span className="text-[10px] font-bold uppercase">Right</span>
                </button>
            </div>
             <div className="col-start-2 row-start-3">
                 <button onClick={() => onResize('bottom', amount)} className="w-full aspect-square bg-white border-2 border-slate-100 hover:border-brand hover:text-brand rounded-xl flex flex-col items-center justify-center gap-1 transition-all shadow-sm hover:translate-y-1">
                    <ArrowDown className="w-6 h-6" /> <span className="text-[10px] font-bold uppercase">Bottom</span>
                </button>
            </div>
        </div>

        <div className="text-center text-xs text-slate-400 font-medium bg-slate-50 p-2 rounded-lg">
            Adds "White" space to edges
        </div>
      </div>
    </div>
  );
};