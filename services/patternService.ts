import { GridData, PaletteColor } from '../types';

// --- HEADER: Pattern Service ---
// logic to convert the 2D grid into structured Row Instructions.

export interface RowInstruction {
  rowNum: number;
  direction: 'RS' | 'WS';
  blocks: { colorId: string; count: number }[];
}

// --- HEADER: Instruction Generator ---
// Converts grid rows into blocks of color counts.
// Handles Right Side (RS) and Wrong Side (WS) directionality.
export const generatePatternInstructions = (
  grid: GridData, 
  palette: PaletteColor[]
): RowInstruction[] => {
  const instructions: RowInstruction[] = [];
  const rows = grid.length;

  for (let i = 0; i < rows; i++) {
    const rowNum = rows - i; // Row 1 is at the bottom (index length-1)
    const rowIndex = i; // Current index in grid array
    
    // Tapestry crochet typically alternates direction
    const isRS = rowNum % 2 !== 0; // Odd rows are Right Side
    
    const rowData = grid[rowIndex]; // The actual array
    
    // Create blocks
    const blocks: { colorId: string; count: number }[] = [];
    
    if (isRS) {
       // Read Right to Left (End to Start of array) for RS
       let currentId = rowData[rowData.length - 1];
       let count = 0;
       for (let j = rowData.length - 1; j >= 0; j--) {
         if (rowData[j] === currentId) {
           count++;
         } else {
           blocks.push({ colorId: currentId, count });
           currentId = rowData[j];
           count = 1;
         }
       }
       blocks.push({ colorId: currentId, count });
    } else {
       // Read Left to Right (Start to End of array) for WS
       let currentId = rowData[0];
       let count = 0;
       for (let j = 0; j < rowData.length; j++) {
         if (rowData[j] === currentId) {
           count++;
         } else {
           blocks.push({ colorId: currentId, count });
           currentId = rowData[j];
           count = 1;
         }
       }
       blocks.push({ colorId: currentId, count });
    }
    
    instructions.push({
      rowNum,
      direction: isRS ? 'RS' : 'WS',
      blocks
    });
  }

  // Return instructions. Note: This list has Row N at index 0, Row 1 at index N.
  // We will sort this later for the PDF.
  return instructions;
};

// --- HEADER: Written Text Generator ---
// Creates raw text lines.
export const generateWrittenInstructions = (rows: RowInstruction[], palette: PaletteColor[]): string[] => {
  return rows.map(row => {
    const parts = row.blocks.map(b => {
      const color = palette.find(p => p.id === b.colorId);
      // Clean color name
      const name = color?.name.replace(/^Color\s+/, 'C') || 'C?';
      return `${name} ${b.count}`;
    });
    return `Row ${row.rowNum} (${row.direction}): ${parts.join(', ')}`;
  });
};