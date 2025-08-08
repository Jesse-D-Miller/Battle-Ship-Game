import { useState } from "react";
import Cell from "./Cell";
import "./Board.css";

function Board({
  boardData,
  onCellClick,
  revealShips = false,
  disableClicks = false,
  previewGenerator = null, // function (r, c) => { coords, valid } | null
}) {
  const [hoverCell, setHoverCell] = useState(null);

  // Build preview from hover position
  const preview =
    hoverCell && previewGenerator
      ? previewGenerator(hoverCell.r, hoverCell.c)
      : null;

  const inPreview = new Set(
    preview?.coords?.map(([r, c]) => `${r},${c}`) ?? []
  );

  // Helper: is the neighbor the same ship token? (e.g., "ship:2")
  const sameShip = (r, c, token) => {
    if (
      r < 0 ||
      c < 0 ||
      r >= boardData.length ||
      c >= boardData[0].length
    ) {
      return false;
    }
    return boardData[r][c] === token;
  };

  return (
    <div className="board">
      {boardData.map((row, r) => (
        <div className="board-row" key={r}>
          {row.map((cell, c) => {
            const isShipToken =
              typeof cell === "string" && cell.startsWith("ship:");
            const displayValue =
              isShipToken && !revealShips
                ? "empty"
                : isShipToken
                ? "ship"
                : cell;

            // Hover preview class
            const previewClass = inPreview.has(`${r},${c}`)
              ? preview?.valid
                ? "preview-ok"
                : "preview-bad"
              : "";

            // Ship outline via CSS var --ship-shadow (no layout shift)
            let extraStyle;
            if (revealShips && isShipToken) {
              const token = cell; // e.g., "ship:3"
              const shadows = [];
              // top
              if (!sameShip(r - 1, c, token)) shadows.push("inset 0 2px 0 #0e7a3a");
              // right
              if (!sameShip(r, c + 1, token)) shadows.push("inset -2px 0 0 #0e7a3a");
              // bottom
              if (!sameShip(r + 1, c, token)) shadows.push("inset 0 -2px 0 #0e7a3a");
              // left
              if (!sameShip(r, c - 1, token)) shadows.push("inset 2px 0 0 #0e7a3a");
              if (shadows.length) {
                extraStyle = { "--ship-shadow": shadows.join(", ") };
              }
            }

            const handleClick = () => {
              if (!disableClicks) onCellClick(r, c);
            };

            return (
              <Cell
                key={`${r}-${c}`}
                value={displayValue}
                extraClass={previewClass}
                extraStyle={extraStyle}
                onClick={handleClick}
                onMouseEnter={() => setHoverCell({ r, c })}
                onMouseLeave={() => setHoverCell(null)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default Board;
