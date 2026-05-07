
import React, { useEffect, useState } from "react";

export default function BadgePopup({ badge, onClose }) {
  const [visible, setVisible] = useState(true);

  if (!badge) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem', backdropFilter: 'blur(10px)' }}>
      <div className="dash-card glass animate-fade-in-up" style={{ 
        width: '100%', 
        maxWidth: '450px', 
        padding: '3rem 2rem', 
        textAlign: 'center',
        border: '1px solid var(--clr-primary)',
        boxShadow: '0 0 50px rgba(34, 197, 94, 0.2), inset 0 0 20px rgba(34, 197, 94, 0.1)',
        borderRadius: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow effect in background */}
        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.15) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '6rem', filter: 'drop-shadow(0 0 20px var(--clr-primary-glow))', marginBottom: '1.5rem', animation: 'bounce 2s infinite' }}>
            {badge.icon}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--clr-primary)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 900, marginBottom: '0.5rem' }}>
            New Achievement Unlocked
          </div>
          <h2 className="display-font" style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
            {badge.name}
          </h2>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            {badge.description}
          </p>
          <button 
            className="btn btn-primary glow-primary" 
            onClick={onClose}
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', borderRadius: '50px' }}
          >
            Awesome!
          </button>
        </div>
      </div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
