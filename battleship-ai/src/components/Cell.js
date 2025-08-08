import './Cell.css';

function Cell({ value, onClick, onMouseEnter, onMouseLeave, extraClass = '', extraStyle }) {
  let symbol = null;
  if (value === 'miss') symbol = '•';
  if (value === 'hit') symbol = '✕';
  if (value === 'sunk') symbol = '☠︎';
  if (value === 'ship') symbol = '';

   return (
    <div
      className={`cell ${value} ${extraClass}`.trim()}
      style={extraStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}


export default Cell;
