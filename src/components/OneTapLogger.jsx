export default function OneTapLogger({ onOpenAdvanced, status }) {
  const QUICK_ITEMS = [
    { id: "phone", label: "Phone", icon: "📱", weight: 0.2 },
    { id: "charger", label: "Charger", icon: "🔌", weight: 0.15 },
    { id: "mouse", label: "Mouse", icon: "🖱️", weight: 0.1 },
    { id: "battery", label: "Battery", icon: "🔋", weight: 0.05 },
  ];

  return (
    <div className="one-tap-container">
      <div className="one-tap-grid">
        {QUICK_ITEMS.map((item) => (
          <div 
            key={item.id} 
            className={`one-tap-card ${status !== "collecting" ? "disabled" : ""}`}
            onClick={() => status === "collecting" && onOpenAdvanced(item)}
            style={status !== "collecting" ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <div className="one-tap-icon">{item.icon}</div>
            <div className="one-tap-label">{item.label}</div>
          </div>
        ))}
        
        <div 
          className={`one-tap-card other-item ${status !== "collecting" ? "disabled" : ""}`} 
          onClick={() => status === "collecting" && onOpenAdvanced(null)}
          style={{
            border: '2px dashed var(--clr-primary)',
            background: 'rgba(34, 197, 94, 0.05)',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.1)',
            transition: 'var(--transition)',
            ...(status !== "collecting" ? { opacity: 0.5, cursor: 'not-allowed' } : {})
          }}
        >
          <div className="one-tap-icon" style={{
            color: 'var(--clr-primary)',
            textShadow: '0 0 10px var(--clr-primary-glow)',
            fontSize: '3rem',
            lineHeight: '1'
          }}>+</div>
          <div className="one-tap-label">Other Item</div>
        </div>
      </div>
    </div>
  );
}
