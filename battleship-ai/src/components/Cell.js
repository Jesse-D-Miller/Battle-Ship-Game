import './Cell.css';

function Cell({ value, onClick }) {
  return (
    <div className={`cell ${value}`} onClick={onClick}>
      {/* value could be 'hit', 'miss', 'ship', 'empty' */}
      {value === 'ship' ? '🚢' : null}
    </div>
  );
}

export default Cell;
