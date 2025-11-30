import React, { useState } from 'react';
import { X, Calculator } from 'lucide-react';

interface GaugeModalProps {
  onApply: (rows: number, cols: number) => void;
  onClose: () => void;
}

export const GaugeModal: React.FC<GaugeModalProps> = ({ onApply, onClose }) => {
  const [widthInches, setWidthInches] = useState(10);
  const [heightInches, setHeightInches] = useState(10);
  const [stitchesPerInch, setStitchesPerInch] = useState(4);
  const [rowsPerInch, setRowsPerInch] = useState(4);

  const calculatedCols = Math.round(widthInches * stitchesPerInch);
  const calculatedRows = Math.round(heightInches * rowsPerInch);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white/95 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/50">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-brand rounded-xl text-white shadow-lg shadow-brand/20">
               <Calculator className="w-6 h-6" /> 
            </div>
            Canvas Size
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
        </div>

        <div className="space-y-6 mb-8">
           <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 hover:border-brand/50 transition-colors">
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 ml-1">Width (in)</label>
                 <input type="number" value={widthInches} onChange={e => setWidthInches(Number(e.target.value))} className="w-full text-lg font-bold text-slate-700 outline-none bg-transparent" />
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 hover:border-brand/50 transition-colors">
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 ml-1">Height (in)</label>
                 <input type="number" value={heightInches} onChange={e => setHeightInches(Number(e.target.value))} className="w-full text-lg font-bold text-slate-700 outline-none bg-transparent" />
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 hover:border-brand/50 transition-colors">
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 ml-1">Stitches / Inch</label>
                 <input type="number" value={stitchesPerInch} onChange={e => setStitchesPerInch(Number(e.target.value))} className="w-full text-lg font-bold text-slate-700 outline-none bg-transparent" />
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 hover:border-brand/50 transition-colors">
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 ml-1">Rows / Inch</label>
                 <input type="number" value={rowsPerInch} onChange={e => setRowsPerInch(Number(e.target.value))} className="w-full text-lg font-bold text-slate-700 outline-none bg-transparent" />
              </div>
           </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl flex items-center justify-between shadow-inner">
            <div>
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Result</p>
                <p className="text-xl font-bold text-brand-dark">{calculatedCols} cols x {calculatedRows} rows</p>
            </div>
            <button 
              onClick={() => onApply(calculatedRows, calculatedCols)}
              className="px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark hover:scale-105 shadow-lg shadow-brand/20 transition-all active:scale-95"
            >
                Apply Size
            </button>
        </div>
      </div>
    </div>
  );
};