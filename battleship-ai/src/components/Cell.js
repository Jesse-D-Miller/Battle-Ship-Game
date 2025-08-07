import './Cell.css';

function Cell({ value, onClick }) {
  return (
    <div className={`cell ${value}`} onClick={onClick}>
      {/* value could be 'hit', 'miss', 'ship', 'empty' */}
    </div>
  );
}

export default Cell;
