# How to Recreate "Tapestry Buddy" from Scratch

This guide outlines the technical steps to rebuild this application using React, TypeScript, and HTML5 Canvas.

## 1. Tech Stack
- **Framework**: React 18+ (Hooks for state).
- **Language**: TypeScript (for strong typing of Grid/Palette data).
- **Styling**: Tailwind CSS (for rapid UI layout and theme configuration).
- **Graphics**: HTML5 Canvas API (for high-performance grid rendering).
- **AI**: Google GenAI SDK (for instruction generation).
- **Icons**: Lucide React.

## 2. Core Data Structures
Define the shape of your data early.
```typescript
type GridData = string[][]; // 2D array of Palette IDs
interface PaletteColor { id: string; hex: string; name: string; }
```

## 3. The Canvas Grid (The Heart of the App)
Instead of rendering thousands of `div`s (which is slow), use a single `<canvas>` element.
- **Render Loop**: A `drawGrid` function that clears the canvas, loops through the `GridData` array, and calls `ctx.fillRect` for each cell.
- **Scaling**: Apply `ctx.scale(scale, scale)` to handle zooming without recalculating coordinates manually.
- **Rulers**: Draw rectangles and text on the top/left margins of the canvas *before* translating the context for the grid.

## 4. Interaction Logic
- **Coordinate Mapping**: Convert `MouseEvent.clientX` to grid coordinates:
  `x = Math.floor((mouseX - rect.left - rulerOffset) / (cellSize * scale))`
- **Smooth Painting**: If the user moves the mouse fast, `mousemove` events fire sparsely. Use **Bresenham's Line Algorithm** to interpolate stitches between the last event and the current event.
- **Flood Fill**: Implement a standard Stack-based Recursive Flood Fill (or Queue-based) to color connected regions.

## 5. Image Processing (The "Smart" Part)
When a user uploads an image:
1. Draw it to a hidden, small canvas (width = grid width).
2. Get `ImageData` (pixel array).
3. **Quantization**: Group pixels into buckets and split the largest buckets until you have the desired number of colors (Median Cut Algorithm).
4. **Mapping**: For every pixel in the resized image, calculate the Euclidean distance to every color in the new palette and assign the closest ID.

## 6. AI Integration
1. Serialize the grid into a compressed text format: `R1: 5xA, 2xB`.
2. Send this text to Gemini API with a prompt: "Convert this compressed data into crochet instructions."

## 7. State Management
- **History**: Maintain a `history` array of grid states.
- **Undo**: `setCurrent(history[index - 1])`.
- **Redo**: `setCurrent(history[index + 1])`.

## 8. Styling & Polish
- Use a `tailwind.config.js` to define the custom brand color `#8FDAFA`.
- Override the system cursor with a custom SVG data URI in CSS.
- Ensure Z-indexes are managed so tooltips and modals sit above the canvas.
