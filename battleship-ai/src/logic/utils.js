export const SHIPS = [
  { id: 'carrier', name: 'Carrier', size: 5 },
  { id: 'battleship', name: 'Battleship', size: 4 },
  { id: 'cruiser', name: 'Cruiser', size: 3 },
  { id: 'submarine', name: 'Submarine', size: 3 },
  { id: 'destroyer', name: 'Destroyer', size: 2 },
];

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

export function isShipCell(value) {
  return typeof value === 'string' && value.startsWith('ship:');
}

export function shipIdFromCell(value) {
  // value like 'ship:carrier'
  return isShipCell(value) ? value.split(':')[1] : null;
}

/**
 * Place ships randomly and return:
 * - board: 2D array with 'empty' or 'ship:<id>'
 * - ships: map { [id]: { id, name, size, hits, coords: [[r,c], ...], sunk } }
 */
export function placeShipsRandomlyWithIds(boardSize = 10) {
  const board = Array(boardSize)
    .fill(null)
    .map(() => Array(boardSize).fill('empty'));

  const ships = {};

  for (const def of SHIPS) {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() < 0.5;
      const row = randomInt(boardSize);
      const col = randomInt(boardSize);

      const fits = horizontal
        ? col + def.size <= boardSize
        : row + def.size <= boardSize;
      if (!fits) continue;

      let overlaps = false;
      for (let i = 0; i < def.size; i++) {
        const r = row + (horizontal ? 0 : i);
        const c = col + (horizontal ? i : 0);
        if (board[r][c] !== 'empty') {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      const coords = [];
      for (let i = 0; i < def.size; i++) {
        const r = row + (horizontal ? 0 : i);
        const c = col + (horizontal ? i : 0);
        board[r][c] = `ship:${def.id}`;
        coords.push([r, c]);
      }

      ships[def.id] = {
        id: def.id,
        name: def.name,
        size: def.size,
        hits: 0,
        coords,
        sunk: false,
      };
      placed = true;
    }
  }

  return { board, ships };
}

export function isValidTarget(board, r, c) {
  const cell = board[r][c];
  return cell !== 'hit' && cell !== 'miss';
}

/**
 * Apply a shot, update board and ships.
 * Returns { board, ships, result: 'hit'|'miss'|'invalid', sunk: shipId|null }
 */
export function applyShotAndUpdate(board, ships, r, c) {
  if (!isValidTarget(board, r, c)) {
    return { board, ships, result: 'invalid', sunk: null };
  }

  const nextBoard = board.map(row => [...row]);
  const nextShips = { ...ships };

  const cell = nextBoard[r][c];
  if (isShipCell(cell)) {
    const id = shipIdFromCell(cell);
    nextBoard[r][c] = 'hit';
    const s = { ...nextShips[id] };
    s.hits += 1;

    if (s.hits >= s.size) {
      s.sunk = true;
      // Mark ALL coords as sunk on the board
      for (const [rr, cc] of s.coords) {
        nextBoard[rr][cc] = 'sunk';
      }
    }

    nextShips[id] = s;
    return { board: nextBoard, ships: nextShips, result: 'hit', sunk: s.sunk ? id : null };
  } else {
    nextBoard[r][c] = 'miss';
    return { board: nextBoard, ships: nextShips, result: 'miss', sunk: null };
  }
}


export function randomUntargetedCell(board) {
  const candidates = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const v = board[r][c];
      if (v !== 'hit' && v !== 'miss') candidates.push([r, c]);
    }
  }
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function allShipsSunk(ships) {
  return Object.values(ships).every(s => s.sunk);
}
