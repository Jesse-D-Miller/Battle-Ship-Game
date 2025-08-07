import { useEffect, useState } from "react";
import Board from "./components/Board";
import {
  placeShipsRandomlyWithIds,
  isValidTarget,
  applyShotAndUpdate,
  allShipsSunk,
} from "./logic/utils";
import { chooseAIMove, mediumHandleResult } from "./logic/ai";

function App() {
  // --- Initial boards + ships
  const [playerBoardState] = useState(() => placeShipsRandomlyWithIds());
  const [aiBoardState] = useState(() => placeShipsRandomlyWithIds());

  const [playerBoard, setPlayerBoard] = useState(playerBoardState.board);
  const [aiBoard, setAiBoard] = useState(aiBoardState.board);
  const [playerShips, setPlayerShips] = useState(playerBoardState.ships);
  const [aiShips, setAiShips] = useState(aiBoardState.ships);

  // --- Game meta
  const [turn, setTurn] = useState("player"); // 'player' | 'ai'
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null); // 'player' | 'ai' | null
  const [lastEvent, setLastEvent] = useState("");

  // --- Difficulty + AI memory
  const [difficulty, setDifficulty] = useState("easy"); // 'easy' | 'medium' | 'hard'
  const [aiState, setAIState] = useState({
    mode: difficulty,
    queue: [],
    lastHits: [],
  });

  useEffect(() => {
    setAIState((s) => ({ ...s, mode: difficulty }));
  }, [difficulty]);

  // --- Player fires at enemy
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
      if (allShipsSunk(nextAIShips)) {
        setGameOver(true);
        setWinner("player");
        setLastEvent("You win! All enemy ships sunk.");
        return;
      }
      // Player keeps turn on hit (house rule). Do nothing.
    } else if (result === "miss") {
      setLastEvent("Miss. Enemy turn.");
      setTurn("ai");
    }
  };

  // --- AI fires when it's AI's turn — keeps firing on hits
  useEffect(() => {
    if (gameOver || turn !== "ai") return;

    let cancelled = false;

    const fire = (board, ships, localAIState) => {
      const { move, nextAI } = chooseAIMove(board, ships, localAIState);
      if (!move) {
        setLastEvent("Enemy has no valid shots left. Your turn.");
        setTurn("player");
        return;
      }

      const [r, c] = move;
      const {
        board: nextBoard,
        ships: nextShips,
        result,
        sunk,
      } = applyShotAndUpdate(board, ships, r, c);

      // push state to UI
      setPlayerBoard(nextBoard);
      setPlayerShips(nextShips);

      // update AI memory (medium uses queue/lastHits)
      let updatedAI = nextAI;
      if (localAIState.mode === "medium") {
        updatedAI = mediumHandleResult(nextBoard, nextAI, r, c, result, sunk);
      }
      setAIState(updatedAI);

      // check lose
      if (allShipsSunk(nextShips)) {
        setGameOver(true);
        setWinner("ai");
        setLastEvent("Defeat. All your ships are sunk.");
        return;
      }

      if (result === "hit") {
        setLastEvent(
          sunk ? `Enemy sunk your ${nextShips[sunk].name}!` : "Enemy hit!"
        );
        // keep firing after a short delay
        setTimeout(() => {
          if (!cancelled) fire(nextBoard, nextShips, updatedAI);
        }, 350);
      } else {
        setLastEvent("Enemy missed. Your turn.");
        setTurn("player"); // give turn back only on miss
      }
    };

    // start the AI chain with current snapshots
    const start = setTimeout(
      () => fire(playerBoard, playerShips, aiState),
      350
    );

    return () => {
      cancelled = true;
      clearTimeout(start);
    };
    // Intentionally only depend on turn/gameOver to avoid re-triggers mid-chain.
  }, [turn, gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Restart
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
    setAIState({ mode: difficulty, queue: [], lastHits: [] });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Battleship AI</h1>

      <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        <span>Difficulty:</span>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>

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
