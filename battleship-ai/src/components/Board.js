import Cell from './Cell';
import './Board.css';

function Board({ boardData, onCellClick }) {
  return (
    <div className="board">
      {boardData.map((row, rowIndex) => (
        <div className="board-row" key={rowIndex}>
          {row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              value={cell}
              onClick={() => onCellClick(rowIndex, colIndex)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Board;
