import './Cell.css';

function Cell({ value, onClick }) {
  let symbol = null;
  if (value === 'miss') symbol = '•';
  if (value === 'hit') symbol = '✕';
  if (value === 'sunk') symbol = '☠︎';
  if (value === 'ship') symbol = '🚢';

  return (
    <div className={`cell ${value}`} onClick={onClick}>
      {symbol}
    </div>
  );
}

export default Cell;
