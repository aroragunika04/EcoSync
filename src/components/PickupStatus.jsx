import React, { useState } from "react";

export default function PickupStatus({ stats, onComplete }) {
  const { current = 0, goal = 10, status = "collecting", marketplaceStatus, assignedRecyclerName, arrivalDate, arrivalTime, pickupLocation, contactName, contactNumber } = stats;
  const remaining = Math.max(0, goal - current);
  const [showQR, setShowQR] = useState(false);

  const getStatusConfig = () => {
    if (marketplaceStatus === "arriving") {
      return {
        label: "Recycler Arriving",
        message: `${assignedRecyclerName} has scheduled your pickup. Please be ready at the designated location.`,
        color: "#F59E0B", // Amber
        icon: "⚡",
      };
    }
    if (marketplaceStatus === "claimed") {
      return {
        label: "Pickup Claimed",
        message: `Mission accepted by ${assignedRecyclerName}. Awaiting arrival schedule.`,
        color: "#3B82F6", // Blue
        icon: "🚚",
      };
    }
    if (marketplaceStatus === "available") {
      return {
        label: "Open for Pickup",
        message: "Your node is full! Waiting for a recycler to claim this mission.",
        color: "#10B981", // Emerald
        icon: "📡",
      };
    }
    
    switch (status) {
      case "completed":
        return {
          label: "Completed",
          message: "Pickup completed. New cycle has started. Great job!",
          color: "#A855F7", // Purple
          icon: "✅",
        };
      case "collecting":
      default:
        return {
          label: "Collecting",
          message: `Keep logging! Once we reach ${goal}kg, a pickup will be triggered.`,
          color: "var(--clr-primary)", // Green
          icon: "♻️",
        };
    }
  };

  const config = getStatusConfig();
  const percentage = Math.min(100, (current / goal) * 100);
  const isActionable = ["claimed", "arriving"].includes(marketplaceStatus);

  return (
    <section className="pickup-banner" style={{
      margin: '1.5rem 0', padding: '1.5rem 2.5rem', minHeight: 'auto', 
      background: 'linear-gradient(90deg, #1A1A1A 0%, #111111 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 'var(--radius-lg)',
      border: `1px solid ${config.color}40`, gap: '2rem', borderLeft: `6px solid ${config.color}`,
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', right: '0', top: '0', bottom: '0', width: '50%',
        background: `radial-gradient(circle at 100% 50%, ${config.color}22 0%, transparent 70%)`,
        zIndex: 0
      }}></div>

      <div className="pickup-left" style={{flex: 1, position: 'relative', zIndex: 1}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem'}}>
          <span style={{fontSize: '1.5rem'}}>{config.icon}</span>
          <h3 style={{fontSize: '1.4rem', fontWeight: '800', color: config.color, textTransform: 'uppercase', letterSpacing: '0.05em'}}>
            {config.label}
          </h3>
          {isActionable && (
            <div className="recycler-badge" style={{ fontSize: '0.7rem', background: 'var(--clr-primary)', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '800' }}>
              RECYCLER ASSIGNED
            </div>
          )}
        </div>
        <p style={{fontSize: '0.9rem', color: 'var(--clr-text-muted)', marginBottom: '1.2rem', maxWidth: '450px', lineHeight: '1.5'}}>
          {config.message}
        </p>

        {marketplaceStatus === "arriving" && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '1rem', 
            marginBottom: '1.5rem',
            background: 'rgba(255,255,255,0.03)',
            padding: '1.2rem',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#F59E0B', fontWeight: 800, letterSpacing: '0.05em' }}>📅 Arrival Schedule</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{arrivalDate} at {arrivalTime}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#F59E0B', fontWeight: 800, letterSpacing: '0.05em' }}>📍 Meeting Point</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{pickupLocation}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#F59E0B', fontWeight: 800, letterSpacing: '0.05em' }}>👤 Contact Partner</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{contactName}</span>
              <a href={`tel:${contactNumber}`} style={{ fontSize: '0.85rem', color: 'var(--clr-primary)', textDecoration: 'none', fontWeight: 700 }}>📞 {contactNumber}</a>
            </div>
          </div>
        )}
        
        <div style={{ maxWidth: '420px' }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "0.5rem" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: '800', color: '#fff', lineHeight: 1 }}>
              {current.toFixed(1)} <span style={{ fontSize: "0.8rem", opacity: 0.5, fontWeight: '500' }}>/ {goal}kg</span>
            </div>
            <div style={{ fontSize: "0.8rem", color: config.color, fontWeight: 700, textTransform: 'uppercase' }}>
              {marketplaceStatus === "collecting" ? `${remaining.toFixed(1)}kg to target` : "Full Capacity"}
            </div>
          </div>
          <div style={{ height: "8px", background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ 
                width: `${percentage}%`, 
                height: '100%',
                backgroundColor: config.color,
                boxShadow: `0 0 15px ${config.color}66`,
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }}></div>
          </div>
        </div>
      </div>
      
      <div className="pickup-right" style={{position: 'relative', zIndex: 1, width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'}}>
        {isActionable ? (
          <div style={{ textAlign: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowQR(!showQR)}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}
            >
              {showQR ? "Hide QR Pass" : "Show Pickup QR"}
            </button>
            {showQR && (
              <div style={{ 
                marginTop: '1rem', 
                background: '#0A0A0A', 
                padding: '1.2rem', 
                borderRadius: '16px', 
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                animation: 'fadeIn 0.4s ease-out'
              }}>
                <div style={{
                  padding: '0.6rem',
                  background: '#fff',
                  borderRadius: '10px',
                  boxShadow: '0 0 20px rgba(255, 255, 255, 0.05)'
                }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=PICKUP_${stats.id}`} 
                    alt="QR Code" 
                    style={{ width: '120px', height: '120px', display: 'block' }} 
                  />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    color: '#10B981', 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.08em',
                    marginBottom: '0.2rem'
                  }}>
                    Secure Verification Token
                  </div>
                  <div style={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    fontSize: '0.6rem',
                    fontWeight: 500,
                    lineHeight: '1.4'
                  }}>
                    Present this code to the recycler<br/>to authorize pickup
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <img src="/images/truck.png" alt="Pickup Truck" style={{
            height: '140px', width: 'auto', objectFit: 'contain', 
            filter: `drop-shadow(0 15px 25px ${config.color}44)`,
            opacity: 0.9
          }} />
        )}
      </div>
    </section>
  );
}
