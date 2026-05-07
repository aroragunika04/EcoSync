import { useEffect, useState } from "react";

export default function ProgressBar({ current, goal, label, unit = "kg" }) {
  const [width, setWidth] = useState(0);
  const pct = Math.min((current / goal) * 100, 100);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="progress-wrapper">
      {label && <p className="progress-label">{label}</p>}
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${width}%` }}
        >
          <span className="progress-glow" />
        </div>
      </div>
      <p className="progress-text">
        {current}
        {unit} / {goal}
        {unit}
      </p>
    </div>
  );
}
