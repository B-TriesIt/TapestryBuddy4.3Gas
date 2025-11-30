import React from 'react';
import { X, MousePointer2, PaintBucket, Eraser, Eye, Upload, FileText, Move, Hand } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-slate-800">How to use Tapestry Buddy</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-brand-dark mb-3">Tools & Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-dim rounded-lg"><Hand className="w-5 h-5 text-brand-dark" /></div>
                <div><p className="font-medium">Move Canvas (Pan)</p><p className="text-sm text-slate-500">Click and drag anywhere to move the canvas around freely.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-dim rounded-lg"><MousePointer2 className="w-5 h-5 text-brand-dark" /></div>
                <div><p className="font-medium">Pencil</p><p className="text-sm text-slate-500">Click or drag to paint individual stitches.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-dim rounded-lg"><PaintBucket className="w-5 h-5 text-brand-dark" /></div>
                <div><p className="font-medium">Fill Bucket</p><p className="text-sm text-slate-500">Fill enclosed areas of the same color.</p></div>
              </div>
            </div>
            <div className="mt-4 bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
               <strong>Tip:</strong> Use the "Reset View" button in the top right to center your canvas if you get lost!
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-brand-dark mb-3">Advanced Features</h3>
            <div className="space-y-3">
               <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-dim rounded-lg"><Upload className="w-5 h-5 text-brand-dark" /></div>
                <div>
                  <p className="font-medium">Image to Chart</p>
                  <p className="text-sm text-slate-500">Upload any picture. The app will automatically map the colors to real-world yarn names.</p>
                </div>
              </div>
               <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-dim rounded-lg"><FileText className="w-5 h-5 text-brand-dark" /></div>
                <div>
                  <p className="font-medium">Generate Pattern PDF</p>
                  <p className="text-sm text-slate-500">Create a professional PDF with a cover page, visual blocks, and written instructions starting from Row 1.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
        
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-brand hover:bg-brand-dark text-white font-medium rounded-lg transition-colors">
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};