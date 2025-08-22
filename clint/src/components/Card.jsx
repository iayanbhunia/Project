function Card({ title, children, className }) {
  return (
    <div className={`card ${className || ''}`}>
      {title && <h2 className="card-title">{title}</h2>}
      <div className="card-body">{children}</div>
    </div>
  );
}

export default Card; 