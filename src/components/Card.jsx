export default function Card({ children, className = "", glow = false }) {
  return (
    <div className={`glass-card ${glow ? "glass-card--glow" : ""} ${className}`}>
      {children}
    </div>
  );
}
