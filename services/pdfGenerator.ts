import { jsPDF } from "jspdf";
import { GridData, PaletteColor, ExportOptions } from "../types";
import { RowInstruction } from "./patternService";

// --- HEADER: PDF Generator ---
// Handles the creation of the multi-page PDF document.
// includes Cover, Chart with Labels, Block Pattern, and Clean Written Instructions.

export const generatePatternPDF = (
  grid: GridData, 
  palette: PaletteColor[], 
  instructions: RowInstruction[],
  writtenInstructions: string[],
  options: ExportOptions
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // --- HEADER: Instruction Sorting ---
  // Ensure we start from Row 1 (Bottom) and go UP.
  const sortedInstructions = [...instructions].sort((a, b) => a.rowNum - b.rowNum);
  
  // --- HEADER: Yarn Ball Doodle ---
  // A vector icon to make the cover look professional. 
  // Adjusted Coordinates to ensure it stays within circle.
  const drawYarnBall = (x: number, y: number, size: number) => {
    const scale = size / 20;
    doc.setLineWidth(0.5 * scale);
    doc.setDrawColor(143, 218, 250); 
    doc.setFillColor(230, 245, 255); 

    // Main circle
    doc.circle(x, y, 10 * scale, 'FD');

    // Curves inside to simulate yarn strands
    doc.path([{op: 'm', c: [x - 6*scale, y - 2*scale]}, {op: 'c', c: [x - 2*scale, y - 6*scale, x + 6*scale, y + 2*scale, x + 6*scale, y + 2*scale]}]);
    doc.path([{op: 'm', c: [x - 5*scale, y + 3*scale]}, {op: 'c', c: [x, y, x + 4*scale, y - 5*scale, x + 6*scale, y - 4*scale]}]);
    
    // Loose thread
    doc.setDrawColor(100, 180, 220);
    doc.path([{op: 'm', c: [x + 6*scale, y + 4*scale]}, {op: 'c', c: [x + 8*scale, y + 8*scale, x + 10*scale, y + 6*scale, x + 12*scale, y + 10*scale]}]);
  };

  // --- HEADER: Pixel Art Renderer ---
  // Draws the grid. 'withGrid' enables labels and lines.
  const drawPixelArt = (x: number, y: number, w: number, h: number, withGrid: boolean = false) => {
    const rows = grid.length;
    const cols = grid[0].length;
    const cellW = w / cols;
    const cellH = h / rows;
    const pixelSize = Math.min(cellW, cellH);
    
    const drawW = pixelSize * cols;
    const drawH = pixelSize * rows;
    const startX = x + (w - drawW) / 2;
    const startY = y + (h - drawH) / 2;

    // Draw Row Labels for Chart
    if (withGrid) {
        doc.setFontSize(8);
        doc.setTextColor(50);
        for(let r=0; r<rows; r++) {
             // Grid index 0 is top row, but physically Row N
             const rowNum = rows - r; 
             const isRS = rowNum % 2 !== 0; 
             const label = `R${rowNum} ${isRS ? '(RS)' : '(WS)'}`;
             // Label on Left
             doc.text(label, startX - 2, startY + r * pixelSize + pixelSize/2 + 1, {align:'right'});
        }
    }

    grid.forEach((row, r) => {
      row.forEach((cellId, c) => {
        const color = palette.find(p => p.id === cellId);
        if (color) {
          doc.setFillColor(color.hex);
          if (withGrid) {
             doc.setDrawColor(220); 
             doc.setLineWidth(0.1);
             doc.rect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize, 'FD');
          } else {
             doc.rect(startX + c * pixelSize, startY + r * pixelSize, pixelSize + 0.2, pixelSize + 0.2, 'F');
          }
        }
      });
    });
    
    doc.setDrawColor(100);
    doc.setLineWidth(0.5);
    doc.rect(startX, startY, drawW, drawH);
  };

  // --- Page 1: Cover ---
  
  doc.setFillColor(252);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setTextColor(50);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Tapestry Buddy", margin, 25);
  
  drawYarnBall(pageWidth - 30, 25, 20);

  doc.setTextColor(0);
  doc.setFontSize(30);
  doc.text(options.title, margin, 75);
  
  drawPixelArt(margin, 90, pageWidth - (margin*2), 100, false);

  const statsY = 220;
  doc.setFontSize(12);
  doc.setTextColor(80);
  doc.text(`Dimensions: ${grid[0].length}W x ${grid.length}H`, margin, statsY);
  doc.text(`Colors: ${palette.length}`, margin, statsY + 8);

  // --- Page 2: Key ---
  if (options.includeChart || options.includeBlocks || options.includeWritten) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(30);
    doc.text("Color Key", margin, 30);
    
    let yPos = 45;
    palette.forEach((color) => {
        doc.setFillColor(color.hex);
        doc.setDrawColor(200);
        doc.rect(margin, yPos - 5, 8, 8, 'FD');
        if (color.symbol) {
            // High contrast text for symbol
            const r = parseInt(color.hex.substring(1,3), 16);
            const g = parseInt(color.hex.substring(3,5), 16);
            const b = parseInt(color.hex.substring(5,7), 16);
            const yiq = ((r*299)+(g*587)+(b*114))/1000;
            doc.setTextColor(yiq < 128 ? 255 : 0);
            doc.setFontSize(8);
            doc.text(color.symbol, margin + 4, yPos + 0.5, {align: 'center'});
        }
        doc.setFontSize(11);
        doc.setTextColor(50);
        doc.text(color.name, margin + 15, yPos);
        yPos += 12;
    });
  }

  // --- OPTION: PIXEL CHART ---
  if (options.includeChart) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(30);
      doc.text("Grid Chart", margin, 30);
      drawPixelArt(margin, 40, pageWidth - (margin*2), pageHeight - 60, true);
  }

  // --- OPTION: VISUAL PATTERN (BLOCKS) ---
  if (options.includeBlocks) {
      doc.addPage();
      let yPos = 30;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30);
      doc.text("Block Pattern (Start Bottom-Up)", margin, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      sortedInstructions.forEach((row) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 30;
        }

        const dirArrow = row.direction === 'RS' ? '←' : '→';
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30);
        doc.text(`Row ${row.rowNum} (${row.direction}) ${dirArrow}`, margin, yPos);
        
        let xOffset = margin + 40;
        
        row.blocks.forEach((block) => {
          const color = palette.find(p => p.id === block.colorId);
          if (!color) return;
          if (xOffset > pageWidth - margin) {
            yPos += 8; 
            xOffset = margin + 40;
            if (yPos > pageHeight - 20) {
                doc.addPage();
                yPos = 30;
                xOffset = margin + 40;
            }
          }
          doc.setFillColor(color.hex);
          doc.setDrawColor(200);
          doc.rect(xOffset, yPos - 4, 6, 6, 'FD');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(60); 
          const text = `${block.count}`; 
          doc.text(text, xOffset + 8, yPos + 0.5);
          xOffset += 8 + doc.getTextWidth(text) + 8;
        });
        yPos += 12;
      });
  }

  // --- OPTION: WRITTEN INSTRUCTIONS ---
  if (options.includeWritten) {
      doc.addPage();
      let yPos = 30;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30);
      doc.text("Written Instructions", margin, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0);

      // --- HEADER: Formatting Logic ---
      // We loop through instructions in sorted order (Row 1 First)
      // Format: Row X (RS): [Color Name] xCount, ...
      sortedInstructions.forEach((row) => {
         if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 30;
         }

         // Header Line
         doc.setFont("helvetica", "bold");
         doc.text(`Row ${row.rowNum} (${row.direction}):`, margin, yPos);
         
         // Content
         doc.setFont("helvetica", "normal");
         const parts = row.blocks.map(b => {
            const color = palette.find(p => p.id === b.colorId);
            return `${color?.name} x${b.count}`;
         }).join(",  ");
         
         const splitText = doc.splitTextToSize(parts, pageWidth - (margin * 2) - 25);
         doc.text(splitText, margin + 25, yPos);
         
         yPos += (splitText.length * 5) + 6; 
      });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  }

  const safeTitle = options.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
  doc.save(`tapestry-buddy-${safeTitle}.pdf`);
};