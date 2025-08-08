import "./Scoreboard.css";

export default function Scoreboard({ scores, currentDifficulty, onReset }) {
  const diffs = ["easy", "medium", "hard"];

  const totalWins = diffs.reduce((acc, d) => acc + (scores[d]?.wins || 0), 0);
  const totalLosses = diffs.reduce((acc, d) => acc + (scores[d]?.losses || 0), 0);

  return (
    <div className="scoreboard">
      <div className="scoreboard-header">
        <h3>Scoreboard</h3>
        <button type="button" onClick={onReset}>Reset stats</button>
      </div>

      <div className="scoreboard-row scoreboard-total">
        <span>Total</span>
        <span>W: {totalWins}</span>
        <span>L: {totalLosses}</span>
      </div>

      {diffs.map((d) => (
        <div
          key={d}
          className={`scoreboard-row ${d === currentDifficulty ? "active" : ""}`}
          title={d === currentDifficulty ? "Current difficulty" : ""}
        >
          <span style={{ textTransform: "capitalize" }}>{d}</span>
          <span>W: {scores[d]?.wins ?? 0}</span>
          <span>L: {scores[d]?.losses ?? 0}</span>
        </div>
      ))}
    </div>
  );
}
