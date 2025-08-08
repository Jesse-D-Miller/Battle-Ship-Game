// Board.js
import { useState } from "react";
import Cell from "./Cell";
import "./Board.css";

function Board({
  boardData,
  onCellClick,
  revealShips = false,
  disableClicks = false,
  previewGenerator = null,
}) {
  const [hoverCell, setHoverCell] = useState(null);

  const preview =
    hoverCell && previewGenerator ? previewGenerator(hoverCell.r, hoverCell.c) : null;

  const inPreview = new Set(preview?.coords?.map(([r, c]) => `${r},${c}`) ?? []);

  const sameShip = (r, c, id) => {
    if (r < 0 || c < 0 || r >= boardData.length || c >= boardData[0].length) return false;
    const v = boardData[r][c];
    return typeof v === "string" && v.startsWith("ship:") && v.split(":")[1] === id;
  };

  return (
    <div className="board">
      {boardData.map((row, r) => (
        <div className="board-row" key={r}>
          {row.map((cell, c) => {
            const isShipCell =
              typeof cell === "string" && cell.startsWith("ship:");
            const shipId = isShipCell ? cell.split(":")[1] : null;

            // what to display
            const displayValue =
              isShipCell && !revealShips ? "empty" : isShipCell ? "ship" : cell;

            // preview classes
            const previewClass = inPreview.has(`${r},${c}`)
              ? preview?.valid
                ? "preview-ok"
                : "preview-bad"
              : "";

            // outline classes (only for visible ships)
            let outlineClasses = "";
            if (revealShips && isShipCell) {
              const top = !sameShip(r - 1, c, shipId);
              const right = !sameShip(r, c + 1, shipId);
              const bottom = !sameShip(r + 1, c, shipId);
              const left = !sameShip(r, c - 1, shipId);
              outlineClasses =
                `${top ? "ship-outline-top " : ""}` +
                `${right ? "ship-outline-right " : ""}` +
                `${bottom ? "ship-outline-bottom " : ""}` +
                `${left ? "ship-outline-left " : ""}`;
            }

            const handleClick = () => {
              if (!disableClicks) onCellClick(r, c);
            };

            return (
              <Cell
                key={`${r}-${c}`}
                value={displayValue}
                extraClass={`${previewClass} ${outlineClasses}`.trim()}
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
