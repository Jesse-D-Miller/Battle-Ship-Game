import { useState } from 'react';
import Board from './components/Board';

function generateEmptyBoard(size = 10) {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill('empty'));
}

function App() {
  const [playerBoard, setPlayerBoard] = useState(generateEmptyBoard());

  const handleCellClick = (row, col) => {
    console.log(`Clicked row ${row}, col ${col}`);
    // Just mark the clicked cell as "hit" for now
    setPlayerBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      newBoard[row][col] = 'hit';
      return newBoard;
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Battleship AI</h1>
      <Board boardData={playerBoard} onCellClick={handleCellClick} />
    </div>
  );
}

export default App;
