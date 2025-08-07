import { useEffect, useState } from "react";
import Board from "./components/Board";
import {
  placeShipsRandomlyWithIds,
  isValidTarget,
  applyShotAndUpdate,
  randomUntargetedCell,
  allShipsSunk,
} from "./logic/utils";

function App() {
  const [playerBoardState] = useState(() => placeShipsRandomlyWithIds());
  const [aiBoardState] = useState(() => placeShipsRandomlyWithIds());

  const [playerBoard, setPlayerBoard] = useState(playerBoardState.board);
  const [aiBoard, setAiBoard] = useState(aiBoardState.board);
  const [playerShips, setPlayerShips] = useState(playerBoardState.ships);
  const [aiShips, setAiShips] = useState(aiBoardState.ships);

  const [turn, setTurn] = useState("player"); // 'player' | 'ai'
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null); // 'player' | 'ai' | null
  const [lastEvent, setLastEvent] = useState("");

  // Player fires at enemy
  const handlePlayerClick = (r, c) => {
    if (gameOver || turn !== "player") return;
    if (!isValidTarget(aiBoard, r, c)) return;

    const {
      board: nextAIBoard,
      ships: nextAIShips,
      result,
      sunk,
    } = applyShotAndUpdate(aiBoard, aiShips, r, c);

    setAiBoard(nextAIBoard);
    setAiShips(nextAIShips);

    if (result === "hit") {
      setLastEvent(
        sunk ? `You sunk the enemy's ${nextAIShips[sunk].name}!` : "Hit!"
      );
      // Optional rule: keep player turn on hit; switch only on miss
      if (allShipsSunk(nextAIShips)) {
        setGameOver(true);
        setWinner("player");
        setLastEvent(`You win! All enemy ships sunk.`);
        return;
      }
      // Player keeps turn on hit (do nothing)
    } else if (result === "miss") {
      setLastEvent("Miss. Enemy turn.");
      setTurn("ai");
    }
  };

  // AI fires when it's AI's turn
  useEffect(() => {
    if (gameOver || turn !== "ai") return;

    const tid = setTimeout(() => {
      const target = randomUntargetedCell(playerBoard);
      if (!target) return; // edge case
      const [r, c] = target;

      const {
        board: nextPlayerBoard,
        ships: nextPlayerShips,
        result,
        sunk,
      } = applyShotAndUpdate(playerBoard, playerShips, r, c);

      setPlayerBoard(nextPlayerBoard);
      setPlayerShips(nextPlayerShips);

      if (result === "hit") {
        setLastEvent(
          sunk ? `Enemy sunk your ${nextPlayerShips[sunk].name}!` : "Enemy hit!"
        );
        if (allShipsSunk(nextPlayerShips)) {
          setGameOver(true);
          setWinner("ai");
          setLastEvent(`Defeat. All your ships are sunk.`);
          return;
        }
        // Optional rule: AI keeps turn on hit; for now, switch back
        setTurn("player");
      } else {
        setLastEvent("Enemy missed. Your turn.");
        setTurn("player");
      }
    }, 400);

    return () => clearTimeout(tid);
  }, [turn, gameOver, playerBoard, playerShips]);

  const resetGame = () => {
    const pb = placeShipsRandomlyWithIds();
    const ab = placeShipsRandomlyWithIds();
    setPlayerBoard(pb.board);
    setPlayerShips(pb.ships);
    setAiBoard(ab.board);
    setAiShips(ab.ships);
    setTurn("player");
    setGameOver(false);
    setWinner(null);
    setLastEvent("New game. Your turn!");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Battleship AI</h1>

      <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
        <div>
          <h2>Your Board</h2>
          <Board
            boardData={playerBoard}
            onCellClick={() => {}}
            revealShips
            disableClicks
          />

          <ul style={{ marginTop: 10 }}>
            {Object.values(playerShips).map((s) => (
              <li key={s.id}>
                {s.name}: {s.hits}/{s.size} {s.sunk ? "— Sunk" : ""}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2>Enemy Board</h2>
          <Board
            boardData={aiBoard}
            onCellClick={handlePlayerClick}
            revealShips={false}
            disableClicks={gameOver || turn !== "player"}
          />

          <ul style={{ marginTop: 10 }}>
            {Object.values(aiShips).map((s) => (
              <li key={s.id}>
                {s.name}: {s.sunk ? "Sunk" : "???"}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <button onClick={resetGame}>Restart</button>
        <p style={{ margin: 0 }}>
          <strong>Status:</strong>{" "}
          {gameOver
            ? `Game Over — ${winner === "player" ? "You Win!" : "You Lose."}`
            : `Turn: ${turn}`}
        </p>
      </div>
      <p>{lastEvent}</p>
    </div>
  );
}

export default App;
