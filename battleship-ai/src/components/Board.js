import Cell from "./Cell";
import "./Board.css";

function Board({ boardData, onCellClick, revealShips = false, disableClicks = false }) {
  return (
    <div className="board">
      {boardData.map((row, rowIndex) => (
        <div className="board-row" key={rowIndex}>
          {row.map((cell, colIndex) => {
            const isShip = typeof cell === 'string' && cell.startsWith('ship:');
            // mask ships unless revealShips
            const displayValue = isShip && !revealShips ? 'empty' : (isShip ? 'ship' : cell);
            const handleClick = () => {
              if (!disableClicks) onCellClick(rowIndex, colIndex);
            };
            return (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                value={displayValue}
                onClick={handleClick}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}



export default Board;
