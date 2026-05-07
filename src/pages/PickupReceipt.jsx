import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PickupReceipt() {
  const { pickupId } = useParams();
  const { state } = useLocation();
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  const summary = state?.summary || { finalWeight: 0, clusterId: pickupId };
  const finalWeightKg = (summary.finalWeight / 1000).toFixed(1);
  const completionTime = new Date().toLocaleString();
  const rewards = Math.floor(summary.finalWeight / 100); // 1 point per 100g

  return (
    <div className="main-content animate-fade-in-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="dash-card" style={{ maxWidth: '500px', width: '100%', padding: '3rem', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '80px', background: 'var(--clr-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 10px 20px var(--clr-primary-glow)' }}>
           ✅
        </div>

        <h1 className="display-font" style={{ marginTop: '1.5rem', fontSize: '2.5rem' }}>Pickup<span>Complete.</span></h1>
        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '2rem' }}>Receipt ID: {pickupId?.substring(0, 8).toUpperCase()}</p>

        <div style={{ background: 'var(--clr-bg-alt)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'left', marginBottom: '2rem', border: '1px solid var(--clr-border)' }}>
           <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recycler Partner</label>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{userData?.companyName || userData?.name || "EcoSync Partner"}</div>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                 <label style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Verified Weight</label>
                 <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--clr-primary)' }}>{finalWeightKg}kg</div>
              </div>
              <div>
                 <label style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Eco-Credits</label>
                 <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFD700' }}>+{rewards}</div>
              </div>
           </div>

           <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--clr-border)' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Timestamp</label>
              <div style={{ fontSize: '0.9rem' }}>{completionTime}</div>
           </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/recycler/dashboard')}>
            Back to Missions
          </button>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => window.print()}>
            ⎙ Print
          </button>
        </div>
        
        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
          Thank you for helping us keep the grid clean. This receipt has been logged to your history.
        </p>
      </div>
    </div>
  );
}
