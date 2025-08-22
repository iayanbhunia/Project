function Button({ type, className, onClick, disabled, children }) {
  return (
    <button
      type={type || 'button'}
      className={`btn ${className || ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button; 