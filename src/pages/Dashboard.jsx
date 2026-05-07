import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, onSnapshot, query, collection, where } from "firebase/firestore";
import { db } from "../services/firebase";
import CircularProgress from "../components/CircularProgress";
import LedgerFeed from "../components/LedgerFeed";
import WasteLogger from "../components/WasteLogger";
import OneTapLogger from "../components/OneTapLogger";
import QuickFacts from "../components/QuickFacts";
import PickupStatus from "../components/PickupStatus";
import { completePickup } from "../services/wasteService";

export default function Dashboard() {
  const { userData, currentUser } = useAuth();
  
  const [stats, setStats] = useState({ current: 0, goal: 20 });
  const [logs, setLogs] = useState([]);
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [loggerInitialItem, setLoggerInitialItem] = useState(null);
  const [pulse, setPulse] = useState(false);

  const triggerPulse = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 1200);
  };

  // Listener for Cluster Progress
  useEffect(() => {
    if (!userData?.clusterId) return;

    const unsub = onSnapshot(doc(db, "clusters", userData.clusterId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStats({
          id: snap.id,
          current: (data.totalWeight || 0) / 1000, 
          goal: (data.threshold || 10000) / 1000,
          status: data.status || "collecting",
          marketplaceStatus: data.marketplaceStatus,
          assignedRecyclerName: data.assignedRecyclerName,
          arrivalDate: data.arrivalDate,
          arrivalTime: data.arrivalTime,
          pickupLocation: data.pickupLocation,
          contactName: data.contactName,
          contactNumber: data.contactNumber
        });
        triggerPulse();
      }
    });

    return () => unsub();
  }, [userData?.clusterId]);

  // Listener for Community History
  useEffect(() => {
    if (!userData?.clusterId) return;

    const q = query(
      collection(db, "waste_logs"),
      where("clusterId", "==", userData.clusterId)
    );

    const unsub = onSnapshot(q, (snap) => {
      triggerPulse();
      const liveLogs = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      liveLogs.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return timeB - timeA;
      });

      setLogs(liveLogs);
    });

    return () => unsub();
  }, [userData?.clusterId]);

  const userName = currentUser?.email?.split('@')[0] || "Aarav";

  return (
    <div className="main-content">
      {/* Hero Section */}
      <section className="dash-hero-container">
        <div className="dash-hero">
          <div className="dash-hero-content">
            <div className="welcome-badge" style={{marginBottom: '0.75rem'}}>
              Hello, {userName}! 🌿
            </div>
            <h1>
              Small actions,
              <span>big impact.</span>
            </h1>
            <p>
              Join the eco-tech revolution. Track your impact and lead the way to a greener future.
            </p>
            
            <button className="btn btn-primary" onClick={() => {
              setLoggerInitialItem(null);
              setIsLoggerOpen(true);
            }} disabled={stats.status !== "collecting"} style={{padding: '0.6rem 1.5rem', fontSize: '0.9rem'}}>
              {stats.status !== "collecting" ? "Pickup Scheduled" : "Log E-Waste Now →"}
            </button>
          </div>
          <img src="/images/Bin (1).png" alt="E-Waste Bin" className="dash-hero-bg" />
        </div>
      </section>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Your Progress */}
        {/* Your Progress */}
        <div className="dash-card">
          <div className="card-header" style={{marginBottom: '0.75rem'}}>
            <div className="card-title-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3 style={{fontSize: '1rem', margin: 0}}>Your Progress</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', background: 'rgba(34, 197, 94, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '12px', color: 'var(--clr-primary)' }}>
                <div className={`pulse-indicator ${pulse ? 'active' : ''}`} style={{ width: '6px', height: '6px', margin: 0 }}></div>
                Live updates
              </div>
            </div>
            <div className="card-icon-box" style={{width: '32px', height: '32px', fontSize: '1rem'}}>
              <span>📈</span>
            </div>
          </div>
          
          <div className="progress-card-content" style={{gap: '1rem', display: 'flex', alignItems: 'center'}}>
            <CircularProgress current={stats.current} goal={stats.goal} />
            <div className="progress-stats-side" style={{flex: 1}}>
              <div className="progress-stat-item" style={{marginBottom: '0.75rem'}}>
                <span className="progress-stat-label" style={{fontSize: '0.65rem'}}>Monthly Goal</span>
                <span className="progress-stat-val" style={{fontSize: '1.25rem', display: 'block'}}>{stats.current.toFixed(1)}kg <span style={{fontSize: '0.8rem', opacity: '0.6'}}>/ {stats.goal}kg collected</span></span>
              </div>
              <div className="goal-bar-container" style={{height: '6px', background: 'var(--clr-bg-alt)', borderRadius: '10px', overflow: 'hidden'}}>
                <div className="goal-bar-fill" style={{width: `${Math.min((stats.current / stats.goal) * 100, 100)}%`, height: '100%', background: 'var(--clr-primary)'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* One Tap Logger */}
        <div className="dash-card advanced-one-tap-card">
          <div className="card-header" style={{marginBottom: '1rem'}}>
            <h3 style={{fontSize: '1rem'}}>One Tap Logger</h3>
          </div>
          <OneTapLogger status={stats.status} onOpenAdvanced={(item = null) => {
            setLoggerInitialItem(item);
            setIsLoggerOpen(true);
          }} />
        </div>

        {/* Community History */}
        <LedgerFeed logs={logs} />

        {/* Did You Know? */}
        <QuickFacts />
      </div>

      {/* Pickup Section */}
      <PickupStatus stats={stats} onComplete={() => completePickup(userData.clusterId)} />

      {/* Bottom Stats Row */}
      {/* Bottom Stats Row */}
      <div className="bottom-stats-row" style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1.5rem'}}>
        <div className="bottom-stat-card" style={{padding: '1.25rem', background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <span style={{fontSize: '1.5rem', background: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem', borderRadius: '12px'}}>♻️</span>
          <div>
            <b style={{fontSize: '1.1rem', display: 'block'}}>1,247 <span style={{fontSize: '0.7rem', opacity: '0.6'}}>kg</span></b>
            <span style={{fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: '600'}}>Collected</span>
          </div>
        </div>
        <div className="bottom-stat-card" style={{padding: '1.25rem', background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <span style={{fontSize: '1.5rem', background: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem', borderRadius: '12px'}}>👥</span>
          <div>
            <b style={{fontSize: '1.1rem', display: 'block'}}>842</b>
            <span style={{fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: '600'}}>Contributors</span>
          </div>
        </div>
        <div className="bottom-stat-card" style={{padding: '1.25rem', background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <span style={{fontSize: '1.5rem', background: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem', borderRadius: '12px'}}>🏢</span>
          <div>
            <b style={{fontSize: '1.1rem', display: 'block'}}>32</b>
            <span style={{fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: '600'}}>Communities</span>
          </div>
        </div>
        <div className="bottom-stat-card" style={{padding: '1.25rem', background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <span style={{fontSize: '1.5rem', background: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem', borderRadius: '12px'}}>🌱</span>
          <div>
            <b style={{fontSize: '1.1rem', display: 'block'}}>2.4 <span style={{fontSize: '0.7rem', opacity: '0.6'}}>ton</span></b>
            <span style={{fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: '600'}}>CO₂ Prevented</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WasteLogger 
        isOpen={isLoggerOpen} 
        onClose={() => {
          setIsLoggerOpen(false);
          setLoggerInitialItem(null);
        }} 
        initialItem={loggerInitialItem}
      />
    </div>
  );
}
