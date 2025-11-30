import { PaletteColor } from '../types';

// --- HEADER: Real World Yarn Database ---
// A curated list of standard yarn color names (DMC/Scheepjes style).
// Used to map auto-generated hex codes from images to human-readable names.
export const YARN_DATABASE: Partial<PaletteColor>[] = [
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Ecru', hex: '#C2B280' },
  { name: 'Black', hex: '#000000' },
  { name: 'Charcoal', hex: '#36454F' },
  { name: 'Silver Grey', hex: '#C0C0C0' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Crimson', hex: '#DC143C' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Hot Pink', hex: '#FF69B4' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Burnt Orange', hex: '#CC5500' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Mustard', hex: '#FFDB58' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Green', hex: '#008000' },
  { name: 'Forest Green', hex: '#228B22' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Lime', hex: '#32CD32' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Cyan', hex: '#00FFFF' },
  { name: 'Tapestry Blue', hex: '#8FDAFA' },
  { name: 'Royal Blue', hex: '#4169E1' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'Violet', hex: '#EE82EE' },
  { name: 'Brown', hex: '#A52A2A' },
  { name: 'Chocolate', hex: '#D2691E' },
  { name: 'Beige', hex: '#F5F5DC' },
];

export const SYMBOLS = ['X', 'O', '/', '\\', '+', '-', '#', '*', '=', '$', '%', '&', '@', '?', '!'];

// --- HEADER: Color Matcher ---
// Calculates Euclidean distance in RGB space to find the closest named color.
export function findClosestYarnColor(r: number, g: number, b: number): string {
  let minDistance = Infinity;
  let closestName = 'Custom Color';

  for (const yarn of YARN_DATABASE) {
    if (!yarn.hex) continue;
    const yr = parseInt(yarn.hex.substring(1, 3), 16);
    const yg = parseInt(yarn.hex.substring(3, 5), 16);
    const yb = parseInt(yarn.hex.substring(5, 7), 16);

    const dist = Math.sqrt(Math.pow(r - yr, 2) + Math.pow(g - yg, 2) + Math.pow(b - yb, 2));
    if (dist < minDistance) {
      minDistance = dist;
      closestName = yarn.name || 'Unknown';
    }
  }
  return closestName;
}