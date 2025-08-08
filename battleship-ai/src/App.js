import { useEffect, useRef, useState } from "react";
import Board from "./components/Board";
import Scoreboard from "./components/Scoreboard";
import "./components/Scoreboard.css";
import "./Controls.css";

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
  const [turn, setTurn] = useState("placement"); // 'placement' | 'player' | 'ai'
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

  // --- Scoreboard (persisted)
  const defaultScores = {
    easy: { wins: 0, losses: 0 },
    medium: { wins: 0, losses: 0 },
    hard: { wins: 0, losses: 0 },
  };
  const [scores, setScores] = useState(defaultScores);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bs-scores"));
      if (saved && typeof saved === "object") {
        setScores({
          easy: { wins: saved?.easy?.wins ?? 0, losses: saved?.easy?.losses ?? 0 },
          medium: { wins: saved?.medium?.wins ?? 0, losses: saved?.medium?.losses ?? 0 },
          hard: { wins: saved?.hard?.wins ?? 0, losses: saved?.hard?.losses ?? 0 },
        });
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem("bs-scores", JSON.stringify(scores));
  }, [scores]);

  const recordedRef = useRef(false); // ensure we only record a result once per game

  const resetStats = () => {
    setScores(defaultScores);
    localStorage.removeItem("bs-scores");
  };

  // --- Preview generator (Board owns hover; we just compute)
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

        if (!recordedRef.current) {
          setScores((prev) => ({
            ...prev,
            [difficulty]: {
              ...prev[difficulty],
              wins: (prev[difficulty]?.wins ?? 0) + 1,
            },
          }));
          recordedRef.current = true;
        }
        return;
      }
      // keep player's turn on hit
    } else {
      setLastEvent("Miss. Enemy turn.");
      setTurn("ai");
    }
  };

  // --- AI turn (keeps firing on hits)
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

        if (!recordedRef.current) {
          setScores((prev) => ({
            ...prev,
            [difficulty]: {
              ...prev[difficulty],
              losses: (prev[difficulty]?.losses ?? 0) + 1,
            },
          }));
          recordedRef.current = true;
        }
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

    const start = setTimeout(() => fire(playerBoard, playerShips, aiState), 350);
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
    recordedRef.current = false; // allow next result to be recorded
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

      {/* --- Controls bar --- */}
      <div className="controls-bar">
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
            <button type="button" onClick={() => setHorizontal((h) => !h)}>
              Rotate: {horizontal ? "Horizontal" : "Vertical"}
            </button>
            <span>
              Placing: <strong>{placingShip.name}</strong> ({placingShip.size})
            </span>
          </>
        )}

        <button type="button" onClick={resetGame}>Restart</button>
      </div>

      {/* --- Boards + Scoreboard --- */}
      <div className="boards-wrap" style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
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

        {/* Scoreboard */}
        <div>
          <Scoreboard
            scores={scores}
            currentDifficulty={difficulty}
            onReset={resetStats}
          />
        </div>
      </div>

      {/* --- Status text --- */}
      <div style={{ marginTop: 20, position: "relative", zIndex: 1 }}>
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
