import { isValidTarget, randomUntargetedCell, isShipCell, shipIdFromCell } from './utils';

// ---------- EASY ----------
function pickEasyMove(board) {
  return randomUntargetedCell(board);
}

// ---------- MEDIUM: Hunt/Target + Parity ----------
function parityCells(board) {
  // Checkerboard: (r + c) % 2 === 0
  const cells = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const v = board[r][c];
      if ((r + c) % 2 === 0 && v !== 'hit' && v !== 'miss' && v !== 'sunk') {
        cells.push([r, c]);
      }
    }
  }
  return cells;
}

function neighbors(r, c, size) {
  const out = [];
  if (r > 0) out.push([r - 1, c]);
  if (r < size - 1) out.push([r + 1, c]);
  if (c > 0) out.push([r, c - 1]);
  if (c < size - 1) out.push([r, c + 1]);
  return out;
}

function enqueueIfValid(board, q, r, c) {
  if (isValidTarget(board, r, c)) q.push([r, c]);
}

function pickMediumMove(board, aiState) {
  const size = board.length;

  // If we have queued targets from a previous hit, pop from there first
  const q = [...aiState.queue];
  while (q.length) {
    const [r, c] = q.shift();
    if (isValidTarget(board, r, c)) {
      return { move: [r, c], nextAI: { ...aiState, queue: q } };
    }
  }

  // Otherwise hunt using parity
  const candidates = parityCells(board);
  if (candidates.length) {
    const idx = Math.floor(Math.random() * candidates.length);
    return { move: candidates[idx], nextAI: { ...aiState, queue: [] } };
  }

  // Fallback to any untargeted
  const fallback = randomUntargetedCell(board);
  return { move: fallback, nextAI: { ...aiState, queue: [] } };
}

// After resolving a shot result, update the medium AI queue
export function mediumHandleResult(board, aiState, r, c, result, sunk) {
  if (result !== 'hit') {
    // on miss: if we were tracking lastHits but sunk happened earlier, clear; else keep
    return aiState;
  }
  // On hit: push orthogonal neighbors (prioritize in-line if we have 2+ hits)
  const size = board.length;
  const lastHits = [...aiState.lastHits, [r, c]];

  // If we have 2+ hits, detect line direction
  let candidates = [];
  if (lastHits.length >= 2) {
    const [r1, c1] = lastHits[lastHits.length - 2];
    const [r2, c2] = lastHits[lastHits.length - 1];
    if (r1 === r2) {
      // horizontal: extend left/right from min/max c
      const row = r1;
      const cs = lastHits.map(([, cc]) => cc).sort((a, b) => a - b);
      if (cs[0] - 1 >= 0 && isValidTarget(board, row, cs[0] - 1)) candidates.push([row, cs[0] - 1]);
      if (cs.at(-1) + 1 < size && isValidTarget(board, row, cs.at(-1) + 1)) candidates.push([row, cs.at(-1) + 1]);
    } else if (c1 === c2) {
      // vertical: extend up/down from min/max r
      const col = c1;
      const rs = lastHits.map(([rr]) => rr).sort((a, b) => a - b);
      if (rs[0] - 1 >= 0 && isValidTarget(board, rs[0] - 1, col)) candidates.push([rs[0] - 1, col]);
      if (rs.at(-1) + 1 < size && isValidTarget(board, rs.at(-1) + 1, col)) candidates.push([rs.at(-1) + 1, col]);
    }
  }
  // If no line yet, push the immediate orthogonal neighbors
  if (!candidates.length) {
    for (const [nr, nc] of neighbors(r, c, size)) {
      if (isValidTarget(board, nr, nc)) candidates.push([nr, nc]);
    }
  }

  // If the hit sunk a ship, clear targeting memory
  if (sunk) {
    return { ...aiState, queue: [], lastHits: [] };
  }

  // Prepend candidates to the queue so we try them next
  return { ...aiState, queue: [...candidates, ...aiState.queue], lastHits };
}

// ---------- HARD: Probabilistic Heatmap ----------
/**
 * Build a heatmap by counting how many legal placements of each remaining ship
 * cover each cell, given current board state (hits/misses/sunk).
 */
function buildHeatmap(board, remainingShips) {
  const size = board.length;
  const heat = Array(size).fill(0).map(() => Array(size).fill(0));

  const canPlace = (len, r, c, horizontal) => {
    if (horizontal) {
      if (c + len > size) return false;
      for (let i = 0; i < len; i++) {
        const cell = board[r][c + i];
        // cannot cross miss, cannot cross 'sunk', and must respect known hits (i.e., allowed)
        if (cell === 'miss' || cell === 'sunk') return false;
      }
      return true;
    } else {
      if (r + len > size) return false;
      for (let i = 0; i < len; i++) {
        const cell = board[r + i][c];
        if (cell === 'miss' || cell === 'sunk') return false;
      }
      return true;
    }
  };

  // “Hard” rule: placements must cover all current HIT cells in line
  const hitCells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 'hit') hitCells.push([r, c]);
    }
  }

  for (const ship of remainingShips) {
    const len = ship.size;
    // Horizontal placements
    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= size - len; c++) {
        if (!canPlace(len, r, c, true)) continue;
        // Ensure all hits along the row can be covered by this placement:
        const cells = Array.from({ length: len }, (_, i) => [r, c + i]);
        if (hitCells.length && !hitCells.every(([hr, hc]) => cells.some(([rr, cc]) => rr === hr && cc === hc))) continue;
        for (const [rr, cc] of cells) if (board[rr][cc] !== 'hit') heat[rr][cc] += 1;
      }
    }
    // Vertical placements
    for (let r = 0; r <= size - len; r++) {
      for (let c = 0; c < size; c++) {
        if (!canPlace(len, r, c, false)) continue;
        const cells = Array.from({ length: len }, (_, i) => [r + i, c]);
        if (hitCells.length && !hitCells.every(([hr, hc]) => cells.some(([rr, cc]) => rr === hr && cc === hc))) continue;
        for (const [rr, cc] of cells) if (board[rr][cc] !== 'hit') heat[rr][cc] += 1;
      }
    }
  }

  return heat;
}

function pickBestFromHeatmap(board, heat) {
  let best = null;
  let bestScore = -1;
  for (let r = 0; r < heat.length; r++) {
    for (let c = 0; c < heat[r].length; c++) {
      if (!isValidTarget(board, r, c)) continue;
      if (heat[r][c] > bestScore) {
        bestScore = heat[r][c];
        best = [r, c];
      }
    }
  }
  return best ?? randomUntargetedCell(board);
}

export function pickHardMove(board, ships) {
  // Remaining ships = not sunk
  const remaining = Object.values(ships).filter(s => !s.sunk).map(s => ({ name: s.name, size: s.size }));
  const heat = buildHeatmap(board, remaining);
  return pickBestFromHeatmap(board, heat);
}

// ---------- PUBLIC: choose move ----------
export function chooseAIMove(board, ships, aiState) {
  if (aiState.mode === 'easy') {
    return { move: pickEasyMove(board), nextAI: aiState };
  }
  if (aiState.mode === 'medium') {
    const picked = pickMediumMove(board, aiState);
    return picked;
  }
  // hard
  const move = pickHardMove(board, ships);
  return { move, nextAI: aiState };
}
