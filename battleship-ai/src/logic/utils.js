export const SHIPS = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
];

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

export function placeShipsRandomly(boardSize = 10) {
  const board = Array(boardSize)
    .fill(null)
    .map(() => Array(boardSize).fill("empty"));

  for (const ship of SHIPS) {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() < 0.5;
      const row = randomInt(boardSize);
      const col = randomInt(boardSize);

      const fits = horizontal
        ? col + ship.size <= boardSize
        : row + ship.size <= boardSize;

      if (!fits) continue;

      let overlaps = false;
      for (let i = 0; i < ship.size; i++) {
        const r = row + (horizontal ? 0 : i);
        const c = col + (horizontal ? i : 0);
        if (board[r][c] !== "empty") {
          overlaps = true;
          break;
        }
      }

      if (overlaps) continue;

      for (let i = 0; i < ship.size; i++) {
        const r = row + (horizontal ? 0 : i);
        const c = col + (horizontal ? i : 0);
        board[r][c] = "ship";
      }

      placed = true;
    }
  }

  return board;
}
