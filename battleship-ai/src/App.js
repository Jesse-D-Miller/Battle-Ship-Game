import { useEffect, useState } from "react";
import Board from "./components/Board";
import {
  SHIPS,
  placeShipsRandomlyWithIds,
  isValidTarget,
  applyShotAndUpdate,
  allShipsSunk,
  generateEmptyBoard,
  placeSpecificShip,
  getPlacementCoords,
  canPlaceShip,
} from "./logic/utils";
import { chooseAIMove, mediumHandleResult } from "./logic/ai";

function App() {
  // --- AI: random at start
  const [aiBoardState] = useState(() => placeShipsRandomlyWithIds());
  const [aiBoard, setAiBoard] = useState(aiBoardState.board);
  const [aiShips, setAiShips] = useState(aiBoardState.ships);

  // --- Player: manual placement
  const [playerBoard, setPlayerBoard] = useState(generateEmptyBoard());
  const [playerShips, setPlayerShips] = useState({});
  const [placingIndex, setPlacingIndex] = useState(0);
  const [horizontal, setHorizontal] = useState(true);

  // --- Game meta
  const [turn, setTurn] = useState("placement");
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [lastEvent, setLastEvent] = useState("");

  // --- Difficulty + AI memory
  const [difficulty, setDifficulty] = useState("easy");
  const [aiState, setAIState] = useState({
    mode: difficulty,
    queue: [],
    lastHits: [],
  });
  useEffect(() => {
    setAIState((s) => ({ ...s, mode: difficulty }));
  }, [difficulty]);

  // --- Preview generator (called inside Board)
  const makePlacementPreview = (r, c) => {
    if (turn !== "placement") return null;
    const shipDef = SHIPS[placingIndex];
    const coords = getPlacementCoords(
      r,
      c,
      shipDef.size,
      horizontal,
      playerBoard.length
    );
    const valid =
      coords.length === shipDef.size &&
      canPlaceShip(playerBoard, r, c, shipDef.size, horizontal);
    return { coords, valid };
  };

  // --- Place ship
  const handlePlaceClick = (r, c) => {
    if (turn !== "placement") return;
    const shipDef = SHIPS[placingIndex];
    const placed = placeSpecificShip(
      playerBoard,
      playerShips,
      shipDef,
      r,
      c,
      horizontal
    );
    if (!placed) {
      setLastEvent("Invalid placement. Try another spot/orientation.");
      return;
    }
    setPlayerBoard(placed.board);
    setPlayerShips(placed.ships);

    const nextIdx = placingIndex + 1;
    if (nextIdx < SHIPS.length) {
      setPlacingIndex(nextIdx);
      setLastEvent(
        `Placed ${shipDef.name}. Next: ${SHIPS[nextIdx].name} (${SHIPS[nextIdx].size}).`
      );
    } else {
      setLastEvent("All ships placed! Your turn.");
      setTurn("player");
    }
  };

  // --- Player fires
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
    } else {
      setLastEvent("Miss. Enemy turn.");
      setTurn("ai");
    }
  };

  // --- AI turn
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

      setPlayerBoard(nextBoard);
      setPlayerShips(nextShips);

      let updatedAI = nextAI;
      if (localAIState.mode === "medium") {
        updatedAI = mediumHandleResult(nextBoard, nextAI, r, c, result, sunk);
      }
      setAIState(updatedAI);

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
        setTimeout(() => {
          if (!cancelled) fire(nextBoard, nextShips, updatedAI);
        }, 350);
      } else {
        setLastEvent("Enemy missed. Your turn.");
        setTurn("player");
      }
    };

    const start = setTimeout(
      () => fire(playerBoard, playerShips, aiState),
      350
    );

    return () => {
      cancelled = true;
      clearTimeout(start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, gameOver]);

  // --- Restart game
  const resetGame = () => {
    const ab = placeShipsRandomlyWithIds();
    setAiBoard(ab.board);
    setAiShips(ab.ships);

    setPlayerBoard(generateEmptyBoard());
    setPlayerShips({});
    setPlacingIndex(0);
    setHorizontal(true);

    setTurn("placement");
    setGameOver(false);
    setWinner(null);
    setLastEvent("Place your ships to begin.");
    setAIState({ mode: difficulty, queue: [], lastHits: [] });
  };

  // --- Boot message
  useEffect(() => {
    if (turn === "placement" && placingIndex === 0) {
      setLastEvent(
        `Place your ${SHIPS[0].name} (${SHIPS[0].size}). Click to place. Use Rotate.`
      );
    }
  }, [turn, placingIndex]);

  const placingShip = SHIPS[placingIndex];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Battleship AI</h1>

      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <span>Difficulty:</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={turn !== "placement"}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        {turn === "placement" && (
          <>
            <button onClick={() => setHorizontal((h) => !h)}>
              Rotate: {horizontal ? "Horizontal" : "Vertical"}
            </button>
            <span>
              Placing: <strong>{placingShip.name}</strong> ({placingShip.size})
            </span>
          </>
        )}

        <button onClick={resetGame}>Restart</button>
      </div>

      <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
        <div>
          <h2>Your Board</h2>
          <Board
            boardData={playerBoard}
            onCellClick={turn === "placement" ? handlePlaceClick : () => {}}
            revealShips
            disableClicks={turn !== "placement"}
            previewGenerator={makePlacementPreview}
          />
          <ul style={{ marginTop: 10 }}>
            {SHIPS.map((s) => {
              const ss = playerShips[s.id];
              return (
                <li key={s.id}>
                  {s.name}:{" "}
                  {ss
                    ? `${ss.hits}/${ss.size}${ss.sunk ? " — Sunk" : ""}`
                    : "— not placed"}
                </li>
              );
            })}
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

      <div style={{ marginTop: 16 }}>
        <p style={{ margin: 0 }}>
          <strong>Status:</strong>{" "}
          {gameOver
            ? `Game Over — ${winner === "player" ? "You Win!" : "You Lose."}`
            : turn === "placement"
            ? "Placing ships…"
            : `Turn: ${turn}`}
        </p>
        <p>{lastEvent}</p>
      </div>
    </div>
  );
}

export default App;
