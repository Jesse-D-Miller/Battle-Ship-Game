import './Cell.css';

function Cell({ value, onClick, onMouseEnter, onMouseLeave, extraClass = '' }) {
  let symbol = null;
  if (value === 'miss') symbol = '•';
  if (value === 'hit') symbol = '✕';
  if (value === 'sunk') symbol = '☠︎';
  if (value === 'ship') symbol = '';

  return (
    <div
      className={`cell ${value} ${extraClass}`.trim()}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {symbol}
    </div>
  );
}


export default Cell;
