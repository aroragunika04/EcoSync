import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";

export default function PickupHistory() {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "pickup_history"),
      where("recyclerId", "==", currentUser.uid),
      orderBy("completedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Failed to fetch history:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="main-content animate-fade-in-up mesh-bg">
      <section className="dash-hero-container" style={{ marginBottom: '2rem' }}>
        <div className="dash-hero glass" style={{ 
          minHeight: '280px', 
          padding: '2rem 4rem',
          background: 'linear-gradient(135deg, rgba(13, 13, 13, 0.95) 0%, rgba(5, 44, 20, 0.9) 100%), url("/images/recycler_hero.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <div className="dash-hero-content">
            <div className="welcome-badge text-glow" style={{ marginBottom: '0.75rem' }}>Pickup Ledger 📜</div>
            <h1 style={{ fontSize: '3.5rem' }}>Mission<span className="text-glow">History.</span></h1>
            <p style={{ fontSize: '1rem', opacity: 0.8 }}>Review your past collections and environmental impact performance.</p>
          </div>
          <div className="dash-hero-bg-overlay" style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', fontSize: '8rem', opacity: 0.05, zIndex: 1 }}>🏛️</div>
        </div>
      </section>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="stat-card" style={{ background: 'var(--clr-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>Total Pickups Completed</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--clr-primary)', marginBottom: '0.5rem' }}>{history.length}</div>
        </div>
        
        <div className="stat-card" style={{ background: 'var(--clr-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>Total Weight Collected</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80', marginBottom: '0.5rem' }}>{(history.reduce((sum, item) => sum + (item.finalWeight || 0), 0) / 1000).toFixed(1)} kg</div>
        </div>
        
        <div className="stat-card" style={{ background: 'var(--clr-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>Communities Served</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#60a5fa', marginBottom: '0.5rem' }}>{new Set(history.map(item => item.clusterId)).size}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Ledger...</div>
      ) : history.length === 0 ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📜</div>
          <h3 className="display-font">No history found</h3>
          <p style={{ color: 'var(--clr-text-muted)' }}>Complete your first pickup to see it in the ledger.</p>
        </div>
      ) : (
        <div className="dash-card glass" style={{ padding: 0, overflow: 'hidden', borderRadius: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--clr-border)' }}>
              <tr>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Cluster Name</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Final Weight</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--clr-border)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '1.25rem', fontSize: '0.9rem' }}>
                    {item.completedAt?.toDate().toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1.25rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    {item.clusterName}
                  </td>
                  <td style={{ padding: '1.25rem', fontSize: '0.9rem' }}>
                    <span className="highlight-text">{item.finalWeight ? (item.finalWeight / 1000).toFixed(1) : "0.0"}kg</span>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--clr-primary)', borderRadius: '4px', fontWeight: 700 }}>
                      COMPLETED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
