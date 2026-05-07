import { useEffect, useState } from "react";

export default function CircularProgress({ current, goal, label, unit = "kg" }) {
  const [offset, setOffset] = useState(251); 
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251

  useEffect(() => {
    const pct = Math.min((current / goal), 1);
    const newOffset = circumference - (pct * circumference);
    const t = setTimeout(() => setOffset(newOffset), 100);
    return () => clearTimeout(t);
  }, [current, goal, circumference]);

  const percentage = Math.round((current / goal) * 100);

  return (
    <div className="circle-progress-wrapper" style={{
      width: '140px', 
      height: '140px', 
      position: 'relative', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center'
    }}>
      <svg className="circle-svg" width="140" height="140" viewBox="0 0 100 100">
        <circle 
          className="circle-bg" 
          cx="50" cy="50" r={radius} 
          style={{stroke: 'var(--clr-bg-alt)', strokeWidth: '8', fill: 'transparent'}}
        />
        <circle 
          className="circle-fill" 
          cx="50" 
          cy="50" 
          r={radius} 
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            stroke: 'var(--clr-primary)', 
            strokeWidth: '8', 
            strokeLinecap: 'round', 
            fill: 'transparent',
            filter: 'drop-shadow(0 0 5px var(--clr-primary-glow))',
            transition: 'stroke-dashoffset 0.8s ease-in-out'
          }}
        />
      </svg>
      <div className="circle-content" style={{
        position: 'absolute', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <span style={{fontSize: '1.75rem', fontWeight: '800', color: '#fff', lineHeight: '1'}}>{percentage}%</span>
        <span style={{fontSize: '0.65rem', color: 'var(--clr-text-muted)', fontWeight: '600', textTransform: 'uppercase', marginTop: '4px'}}>
          Done
        </span>
      </div>
    </div>
  );
}
