import React, { useState, useRef, useEffect } from 'react';
import { PaletteColor, GridData } from '../types';
import { Upload, Sliders, Check, Palette } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { findClosestYarnColor } from '../data/yarns';

// --- HEADER: Image Import Component ---
// Handles uploading an image, pixelating it to grid dimensions,
// and generating a palette with Real-World yarn names.

interface ImageImportProps {
  palette: PaletteColor[]; 
  onImport: (grid: GridData, newPalette: PaletteColor[]) => void;
  onCancel: () => void;
}

export const ImageImport: React.FC<ImageImportProps> = ({ onImport, onCancel }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [width, setWidth] = useState(40);
  const [colorCount, setColorCount] = useState(8);
  const [aspectRatio, setAspectRatio] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewGrid, setPreviewGrid] = useState<GridData | null>(null);
  const [generatedPalette, setGeneratedPalette] = useState<PaletteColor[]>([]);

  // --- HEADER: File Reader ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // --- HEADER: Re-process Trigger ---
  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setAspectRatio(img.width / img.height);
      processImage(img);
    };
  }, [imageSrc, width, colorCount]);

  // --- HEADER: Processing Logic ---
  const processImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const height = Math.round(width / aspectRatio);
    canvas.width = width;
    canvas.height = height;
    
    // Draw image small to effectively pixelate it
    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    // 1. Generate Palette
    const newPalette = quantizeColors(pixels, colorCount);
    setGeneratedPalette(newPalette);

    // 2. Map Pixels to Palette
    const newGrid: GridData = [];
    for (let y = 0; y < height; y++) {
      const row: string[] = [];
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const closest = findClosestColor(r, g, b, newPalette);
        row.push(closest.id);
      }
      newGrid.push(row);
    }
    setPreviewGrid(newGrid);
  };

  // --- HEADER: Quantization Algorithm ---
  // Reduces the image to 'colorCount' dominant colors using Median Cut.
  const quantizeColors = (pixels: Uint8ClampedArray, count: number): PaletteColor[] => {
    const colors: {r: number, g: number, b: number}[] = [];
    const step = 5; 
    for(let i = 0; i < pixels.length; i += 4 * step) {
      if(pixels[i+3] > 128) { // Ignore transparent
        colors.push({ r: pixels[i], g: pixels[i+1], b: pixels[i+2] });
      }
    }

    if (colors.length === 0) return [];

    let buckets = [colors];

    while(buckets.length < count) {
       let maxRange = -1;
       let splitIndex = -1;
       let bestChannel: 'r'|'g'|'b' = 'r';

       for(let i=0; i<buckets.length; i++) {
         const b = buckets[i];
         if(b.length < 2) continue;
         
         const rMin = Math.min(...b.map(c=>c.r)), rMax = Math.max(...b.map(c=>c.r));
         const gMin = Math.min(...b.map(c=>c.g)), gMax = Math.max(...b.map(c=>c.g));
         const bMin = Math.min(...b.map(c=>c.b)), bMax = Math.max(...b.map(c=>c.b));
         
         const range = Math.max(rMax-rMin, gMax-gMin, bMax-bMin);
         if(range > maxRange) {
           maxRange = range;
           splitIndex = i;
           bestChannel = (rMax-rMin) === range ? 'r' : ((gMax-gMin) === range ? 'g' : 'b');
         }
       }

       if(splitIndex === -1) break;

       const bucket = buckets[splitIndex];
       buckets.splice(splitIndex, 1);

       bucket.sort((c1, c2) => c1[bestChannel] - c2[bestChannel]);
       const mid = Math.floor(bucket.length / 2);
       buckets.push(bucket.slice(0, mid));
       buckets.push(bucket.slice(mid));
    }

    return buckets.map((bucket, idx) => {
      const r = Math.round(bucket.reduce((s, c) => s + c.r, 0) / bucket.length);
      const g = Math.round(bucket.reduce((s, c) => s + c.g, 0) / bucket.length);
      const b = Math.round(bucket.reduce((s, c) => s + c.b, 0) / bucket.length);
      
      const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      
      // Use Real World Naming
      const name = findClosestYarnColor(r, g, b);

      return { id: (idx + 1).toString(), name: name, hex };
    });
  };

  // --- HEADER: Distance Helper ---
  const findClosestColor = (r: number, g: number, b: number, palette: PaletteColor[]) => {
    let minDist = Infinity;
    let closest = palette[0];
    for (const color of palette) {
      const hex = color.hex;
      const cr = parseInt(hex.substring(1, 3), 16);
      const cg = parseInt(hex.substring(3, 5), 16);
      const cb = parseInt(hex.substring(5, 7), 16);
      const dist = Math.sqrt(Math.pow(r - cr, 2) + Math.pow(g - cg, 2) + Math.pow(b - cb, 2));
      if (dist < minDist) {
        minDist = dist;
        closest = color;
      }
    }
    return closest;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-brand-dim/30">
          <h2 className="text-xl font-bold text-slate-700">Import Photo to Chart</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">Close</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 space-y-6">
            {!imageSrc ? (
              <div className="border-2 border-dashed border-brand rounded-xl p-8 flex flex-col items-center justify-center text-center bg-brand-light/20 hover:bg-brand-light/40 transition-colors cursor-pointer relative h-64">
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Upload className="w-12 h-12 text-brand mb-4" />
                <p className="text-slate-600 font-medium">Click to upload an image</p>
                <p className="text-xs text-slate-400 mt-2">JPG or PNG recommended</p>
              </div>
            ) : (
              <div className="space-y-6">
                 <div className="relative rounded-lg overflow-hidden shadow-md bg-slate-100">
                    <img src={imageSrc} alt="Original" className="w-full object-contain max-h-48" />
                    <button onClick={() => setImageSrc(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"><Upload className="w-4 h-4 rotate-45" /></button>
                 </div>
                 <div className="space-y-4">
                   <div>
                     <label className="text-sm font-medium text-slate-700 mb-2 flex items-center justify-between">
                       <span className="flex items-center gap-2"><Sliders className="w-4 h-4 text-brand" /> Grid Width</span>
                       <span className="text-brand-dark font-bold">{width} sts</span>
                     </label>
                     <input type="range" min="10" max="150" value={width} onChange={(e) => setWidth(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand" />
                   </div>
                   <div>
                     <label className="text-sm font-medium text-slate-700 mb-2 flex items-center justify-between">
                       <span className="flex items-center gap-2"><Palette className="w-4 h-4 text-brand" /> Max Colors</span>
                       <span className="text-brand-dark font-bold">{colorCount}</span>
                     </label>
                     <input type="range" min="2" max="16" value={colorCount} onChange={(e) => setColorCount(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand" />
                   </div>
                 </div>
                 <div className="bg-brand-dim/50 border border-brand-light p-3 rounded-lg text-xs text-slate-600">
                    Real-world yarn names will be automatically assigned.
                 </div>
              </div>
            )}
          </div>
          <div className="flex-1 bg-slate-100 rounded-xl flex items-center justify-center p-4 border border-slate-200 relative min-h-[300px]">
             <canvas ref={canvasRef} className="hidden" /> 
             {previewGrid ? (
               <div className="flex flex-col items-center gap-4 w-full h-full overflow-auto">
                 <div className="shadow-lg bg-white ring-1 ring-slate-200" style={{ display: 'grid', gridTemplateColumns: `repeat(${width}, 1fr)`, width: '100%', maxWidth: '500px', aspectRatio: `${aspectRatio}` }}>
                   {previewGrid.map((row, y) => row.map((cellId, x) => {
                        const color = generatedPalette.find(p => p.id === cellId);
                        return <div key={`${x}-${y}`} style={{ backgroundColor: color?.hex }} className="w-full h-full" />;
                   }))}
                 </div>
                 <div className="flex flex-wrap justify-center gap-2 max-w-md">
                    {generatedPalette.map(p => (
                      <div key={p.id} className="w-8 h-8 rounded-full shadow-sm ring-1 ring-black/5" style={{backgroundColor: p.hex}} title={p.name}></div>
                    ))}
                 </div>
               </div>
             ) : (
               <div className="text-slate-400 text-sm">Preview will appear here</div>
             )}
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button onClick={onCancel} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
          <Tooltip text="Create new project from image">
            <button onClick={() => previewGrid && onImport(previewGrid, generatedPalette)} disabled={!previewGrid} className="px-6 py-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Check className="w-4 h-4" /> Import to Grid</button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};