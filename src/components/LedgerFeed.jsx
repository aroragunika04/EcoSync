import React, { useState } from "react";

export default function LedgerFeed({ logs = [] }) {
  const [showArchive, setShowArchive] = useState(false);
  // Helper for time ago format
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "just now";
    const now = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const activeLogsBase = logs.filter(log => !log.archived);
  const displayActive = activeLogsBase.slice(0, 4);
  
  const displayArchive = logs.filter(log => {
      if (log.archived) return true;
      // If log is NOT archived but didn't make the top 4 active slots, overflow it to archive:
      return activeLogsBase.indexOf(log) >= 4;
  });

  const displayLogs = showArchive ? displayArchive : displayActive;

  const getIcon = (type) => {
    const icons = {
      phone: "📱",
      charger: "🔌",
      mouse: "🖱️",
      battery: "🔋",
      laptop: "💻",
      monitor: "🖥️",
      tablet: "📟"
    };
    return icons[type] || "📦";
  };

  return (
    <div className="dash-card">
      <div className="card-header" style={{marginBottom: '0.75rem'}}>
        <div className="card-title-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
          <h3 style={{fontSize: '1rem', margin: 0}}>History</h3>
          <div style={{ display: 'flex', background: 'var(--clr-bg-alt)', borderRadius: 'var(--radius-sm)', padding: '0.2rem' }}>
            <button 
              onClick={() => setShowArchive(false)}
              style={{
                background: !showArchive ? 'var(--clr-border)' : 'transparent',
                border: 'none', color: !showArchive ? '#fff' : 'var(--clr-text-muted)',
                padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer'
              }}
            >Active</button>
            <button 
              onClick={() => setShowArchive(true)}
              style={{
                background: showArchive ? 'var(--clr-border)' : 'transparent',
                border: 'none', color: showArchive ? '#fff' : 'var(--clr-text-muted)',
                padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer'
              }}
            >Archive</button>
          </div>
        </div>
        <div className="card-icon-box" style={{width: '32px', height: '32px', fontSize: '1rem'}}>
          <span>👥</span>
        </div>
      </div>

      <div className="history-list" style={{gap: '0.5rem'}}>
        {displayLogs.length > 0 ? (
          displayLogs.map((log) => (
            <div key={log.id} className="history-item" style={{padding: '0.6rem 0.8rem', background: 'transparent', border: 'none', borderBottom: '1px solid var(--clr-border)', borderRadius: '0'}}>
              <div className="history-icon-box" style={{
                width: '32px', height: '32px', borderRadius: '50%', 
                background: 'rgba(255,255,255,0.03)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem',
                fontSize: '0.9rem', border: '1px solid var(--clr-border)'
              }}>
                {getIcon(log.itemType)}
              </div>
              <div className="history-info">
                <div className="history-name" style={{fontSize: '0.85rem', fontWeight: '600'}}>
                  {log.userName ? `${log.userName.split('@')[0]} added a ${log.itemType || "item"}` : `Someone added a ${log.itemType || "item"}`}
                </div>
                <div className="history-action" style={{fontSize: '0.75rem', color: 'var(--clr-primary)', marginTop: '2px', fontWeight: '600'}}>
                  {(() => {
                    if (!log.weight) return "(+0g)";
                    const wKg = log.weight * (log.quantity || 1);
                    return wKg < 1 ? `(+${wKg * 1000}g)` : `(+${wKg}kg)`;
                  })()}
                </div>
              </div>
              <div className="history-meta" style={{gap: '0.25rem'}}>
                <div className="history-time" style={{fontSize: '0.65rem', color: 'var(--clr-text-muted)'}}>{formatTimeAgo(log.timestamp)}</div>
              </div>
            </div>
          ))
        ) : (
          <div style={{padding: "1.5rem", textAlign: "center", color: "var(--clr-text-muted)", fontSize: "0.8rem"}}>
            {showArchive ? "No archived logs available yet." : "No active cycle logs currently."}
          </div>
        )}
      </div>
    </div>
  );
}
