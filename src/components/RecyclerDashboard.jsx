import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { completePickup } from "../services/wasteService";

export default function RecyclerDashboard() {
  const { currentUser } = useAuth();
  const [clusters, setClusters] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "clusters"),
      where("recyclerId", "==", currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setClusters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  const scheduled = clusters.filter(c => c.status === "scheduled");

  return (
    <div className="main-content mesh-bg">
      {/* Hero Section */}
      <section className="dash-hero-container" style={{ marginBottom: '2rem' }}>
        <div className="dash-hero glass" style={{ 
          background: 'linear-gradient(135deg, rgba(5, 44, 20, 0.95) 0%, rgba(0, 0, 0, 0.9) 100%), url("/images/recycler_hero.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '300px',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          <div className="dash-hero-content" style={{ position: 'relative', zIndex: 2 }}>
            <div className="welcome-badge text-glow" style={{marginBottom: '0.75rem'}}>
              Recycler Portal 🚛
            </div>
            <h1 style={{ fontSize: '3.5rem' }}>
              Resource
              <span className="text-glow">Recovery.</span>
            </h1>
            <p style={{ opacity: 0.9, maxWidth: '500px' }}>
              Access the global e-waste network, claim high-capacity clusters, and manage your collection logistics from a single unified dashboard.
            </p>
          </div>
          <img 
            src="/images/truck.png" 
            alt="Pickup Truck" 
            className="dash-hero-bg" 
            style={{ 
              objectFit: 'contain', 
              filter: 'drop-shadow(0 0 40px var(--clr-primary-glow))',
              right: '-2%',
              width: '450px',
              opacity: 0.7
            }} 
          />
        </div>
      </section>

      {/* Main Panel */}
      <div className="dash-card glass" style={{ padding: '2.5rem' }}>
        <h3 className="display-font" style={{ marginBottom: '1.5rem', color: 'var(--clr-primary)' }}>Pending Collections</h3>
        
        {scheduled.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--clr-bg-alt)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '3rem', opacity: 0.5, display: 'block', marginBottom: '1rem' }}>✅</span>
            <h4 style={{ color: 'var(--clr-text-muted)' }}>No active pickups scheduled.</h4>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {scheduled.map(c => {
              const weightMetric = c.totalWeight ? (c.totalWeight / 1000).toFixed(1) : "0.0";
              const thresholdMetric = c.threshold ? (c.threshold / 1000).toFixed(1) : "10.0";

              return (
                <div key={c.id} className="animate-fadeInUp glow-hover" style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', padding: '2rem', borderRadius: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.08)', borderLeft: '4px solid var(--clr-primary)',
                  transition: 'all 0.3s'
                }}>
                  <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {c.name || `Cluster: ${c.id.substring(0,6).toUpperCase()}`}
                    <span style={{fontSize: '0.8rem', opacity: 0.5}}>{c.id.substring(0,4)}</span>
                  </h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--clr-text-muted)' }}>
                    <span>Target Reached</span>
                    <strong style={{ color: 'var(--clr-primary)' }}>{weightMetric}kg <span style={{fontSize: '0.7rem', opacity: 0.5}}>/ {thresholdMetric}kg</span></strong>
                  </div>
                  
                  <button 
                    className="btn btn-primary" 
                    onClick={() => completePickup(c.id)}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
                  >
                    ✓ Confirm Pickup
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
