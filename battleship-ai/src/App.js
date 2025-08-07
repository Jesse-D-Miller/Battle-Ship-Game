import { useState } from "react";
import Board from "./components/Board";
import { placeShipsRandomly } from "./logic/utils";

function generateEmptyBoard(size = 10) {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill("empty"));
}

function App() {
  const [playerBoard, setPlayerBoard] = useState(placeShipsRandomly());
  const [aiBoard, setAiBoard] = useState(placeShipsRandomly());

  const handlePlayerClick = (row, col) => {
    // Mark cell on AI board as hit
    setAiBoard((prev) => {
      const newBoard = prev.map((row) => [...row]);
      newBoard[row][col] = "hit";
      return newBoard;
    });
  };

  const handleAIClick = (row, col) => {
    // Mark cell on player board as hit
    setPlayerBoard((prev) => {
      const newBoard = prev.map((row) => [...row]);
      newBoard[row][col] = "hit";
      return newBoard;
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Battleship AI</h1>
      <div style={{ display: "flex", gap: "40px" }}>
        <div>
          <h2>Your Board</h2>
          <Board
            boardData={playerBoard}
            onCellClick={handleAIClick}
            revealShips // show your ships
          />
        </div>
        <div>
          <h2>Enemy Board</h2>
          <Board
            boardData={aiBoard}
            onCellClick={handlePlayerClick}
            revealShips={true} // hide enemy ships when set to false
          />
        </div>
      </div>
    </div>
  );
}

export default App;
