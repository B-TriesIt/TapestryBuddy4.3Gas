# Tapestry Buddy - Feature Documentation

## 1. Grid Editor
- **Move (Pan) Tool**: Click and drag to move the canvas around freely within the viewport.
- **Pencil Tool**: Draw single stitches.
- **Fill Tool**: Flood fill 8-way connected areas.
- **Reset View**: Quickly return the canvas to the top-left origin.
- **Clear Canvas**: Resets the entire grid to white (with safety confirmation).

## 2. Palette System
- **Real World Colors**: Automatically identifies imported colors using a database of 30+ standard yarn names (e.g., "Royal Blue", "Mustard").
- **Color Wheel**: Single-click selection preventing accidental multi-color adds.
- **Delete All**: Clears the entire palette and resets the grid.

## 3. PDF Export
- **Cover Page**: Features a vector-based "Yarn Ball" doodle and a grid-free pixel preview.
- **Row Ordering**: Instructions are generated **Bottom-Up** (starting at Row 1), following standard crochet conventions.
- **Visual Chart**: Includes Row Numbers and RS/WS (Right Side/Wrong Side) indicators on every row.
- **Written Instructions**: Clean, legible list format.

## 4. UI/UX
- **Tooltips**: High-priority z-index tooltips explain every function.
- **Retractable Palette**: Slide the palette away to maximize workspace.
- **Canvas Resize**: Adds transparent (white) space to any side of the canvas.