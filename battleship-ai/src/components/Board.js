import { useState } from "react";
import Cell from "./Cell";
import "./Board.css";

function Board({
  boardData,
  onCellClick,
  revealShips = false,
  disableClicks = false,
  previewGenerator = null, // function(row, col) => { coords, valid }
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

  return (
    <div className="board">
      {boardData.map((row, rowIndex) => (
        <div className="board-row" key={rowIndex}>
          {row.map((cell, colIndex) => {
            const isShip = typeof cell === "string" && cell.startsWith("ship:");
            const displayValue =
              isShip && !revealShips ? "empty" : isShip ? "ship" : cell;

            const previewClass = inPreview.has(`${rowIndex},${colIndex}`)
              ? preview?.valid
                ? "preview-ok"
                : "preview-bad"
              : "";

            const handleClick = () => {
              if (!disableClicks) onCellClick(rowIndex, colIndex);
            };

            return (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                value={displayValue}
                extraClass={previewClass}
                onClick={handleClick}
                onMouseEnter={() => setHoverCell({ r: rowIndex, c: colIndex })}
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
