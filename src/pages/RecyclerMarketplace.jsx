import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { claimCluster, getReverseGeocode } from "../services/clusterService";
import { getClusterComposition } from "../services/wasteService";
import { useNavigate } from "react-router-dom";

const ITEM_ICONS = {
  "Phone": "📱", "Laptop": "💻", "Battery": "🔋",
  "Charger": "🔌", "Monitor": "🖥️", "Keyboard": "⌨️",
};

function getIcon(name) {
  for (const [key, icon] of Object.entries(ITEM_ICONS)) {
    if (name?.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return "♻️";
}


export default function RecyclerMarketplace() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [filter, setFilter] = useState("ready"); 
  const [compositions, setCompositions] = useState({});
  const [loading, setLoading] = useState({});

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(collection(db, "clusters"), (snap) => {
      const clusterData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClusters(clusterData);
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    // Fetch compositions for clusters that hit threshold
    const readyClusters = clusters.filter(c => c.marketplaceStatus === "available" && !compositions[c.id]);
    
    readyClusters.forEach(async (c) => {
      if (loading[c.id]) return;
      setLoading(prev => ({ ...prev, [c.id]: true }));
      try {
        const comp = await getClusterComposition(c.id);
        setCompositions(prev => ({ ...prev, [c.id]: comp }));
      } catch (err) {
        console.error("Failed to fetch composition:", err);
      } finally {
        setLoading(prev => ({ ...prev, [c.id]: false }));
      }
    });
  }, [clusters]);

  // Market Filters
  const marketFiltered = clusters.filter(c => {
    if (filter === "ready") return c.marketplaceStatus === "available";
    if (filter === "collecting") return c.marketplaceStatus === "collecting";
    return false;
  });

  const readyCount = clusters.filter(c => c.marketplaceStatus === "available").length;

  async function handleClaimClick(cluster) {
    if (!window.confirm(`Claim ${cluster.name}? This will assign the pickup mission to you.`)) return;
    
    try {
      await claimCluster(
        cluster.id, 
        currentUser.uid, 
        userData?.name || currentUser.email.split('@')[0]
      );
      navigate("/recycler/dashboard");
    } catch (err) {
      alert("Failed to claim pickup: " + err);
    }
  }

  return (
    <div className="main-content animate-fade-in-up mesh-bg">
      <section className="dash-hero-container" style={{ marginBottom: '2rem' }}>
        <div className="dash-hero glass" style={{ 
          minHeight: '320px', 
          padding: '2rem 4rem',
          background: 'linear-gradient(135deg, rgba(13, 13, 13, 1) 0%, rgba(5, 44, 20, 1) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div className="dash-hero-content" style={{ position: 'relative', zIndex: 2 }}>
            <div className="welcome-badge text-glow" style={{ marginBottom: '0.75rem' }}>Recycler Marketplace 🏪</div>
            <h1 style={{ fontSize: '4rem' }}>The Global<span className="text-glow">Grid.</span></h1>
            <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '600px' }}>Claim high-threshold clusters and optimize your logistics route with real-time grid intelligence.</p>
          </div>
          <div className="dash-hero-bg-overlay" style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', fontSize: '8rem', opacity: 0.05, zIndex: 1 }}>🚛</div>
        </div>
      </section>

      <div className="marketplace-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'var(--clr-bg-card)', padding: '0.5rem', borderRadius: '50px', width: 'fit-content', border: '1px solid var(--clr-border)' }}>
        {[
          { key: "ready", label: `Available (${readyCount})` },
          { key: "collecting", label: "Monitoring" }
        ].map(f => (
          <button 
            key={f.key} 
            className={`nav-link ${filter === f.key ? "active" : ""}`} 
            onClick={() => setFilter(f.key)}
            style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {marketFiltered.length === 0 ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📡</div>
          <h3 className="display-font">No clusters found</h3>
          <p style={{ color: 'var(--clr-text-muted)' }}>Wait for residents to log more e-waste. Clusters hit the marketplace at 10kg.</p>
        </div>
      ) : (
        <div className="marketplace-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {marketFiltered.map(c => {
            const weight = c.totalWeight ? (c.totalWeight / 1000).toFixed(1) : "0.0";
            const progress = c.totalWeight && c.threshold ? Math.min((c.totalWeight / c.threshold) * 100, 100) : 0;
            const isReady = c.marketplaceStatus === "available";

            return (
              <div key={c.id} className="dash-card glass glow-hover animate-fade-in-up" style={{ 
                display: 'flex', alignItems: 'center', gap: '2rem', padding: '1.5rem 2.5rem', 
                background: isReady ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                border: isReady ? '1px solid var(--clr-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '24px'
              }}>
                <div style={{ fontSize: '2rem', background: 'rgba(255,255,255,0.05)', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getIcon(c.name)}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 className="display-font" style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{c.name || `Node ${c.id.substring(0,4)}`}</h3>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                    <span>📍 {c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)}</span>
                    <span>⚖️ {weight}kg collected</span>
                  </div>
                </div>

                <div style={{ width: '200px' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>Node Capacity</div>
                  <div className="goal-bar-container" style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}>
                    <div className="goal-bar-fill" style={{ width: `${progress}%`, background: isReady ? 'var(--clr-primary)' : '#555' }} />
                  </div>
                </div>

                <div style={{ width: '180px', textAlign: 'right' }}>
                  {isReady ? (
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleClaimClick(c)}
                      style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem', borderRadius: '50px' }}
                    >
                      🤝 Claim Job
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', fontStyle: 'italic' }}>
                      Monitoring...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
