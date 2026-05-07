import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { updatePickupStatus } from "../services/clusterService";
import { completePickup } from "../services/wasteService";
import { Link, useNavigate } from "react-router-dom";

export default function RecyclerDashboard() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [stats, setStats] = useState({ totalWeight: 0, completedCount: 0 });
  const [processing, setProcessing] = useState(null);
  const [schedulingCluster, setSchedulingCluster] = useState(null);
  const [scheduleData, setScheduleData] = useState({ date: "", time: "", location: "", contactName: "", contactNumber: "" });
  const [qrVerifyingCluster, setQrVerifyingCluster] = useState(null);
  const [qrStatus, setQrStatus] = useState("idle"); // idle, scanning, success

  useEffect(() => {
    if (!currentUser) return;
    
    const qActive = query(
      collection(db, "clusters"),
      where("assignedRecyclerId", "==", currentUser.uid)
    );
    const unsubActive = onSnapshot(qActive, (snap) => {
      setClusters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const fetchStats = async () => {
      const qHist = query(
        collection(db, "pickup_history"),
        where("recyclerId", "==", currentUser.uid)
      );
      const snap = await getDocs(qHist);
      let weight = 0;
      snap.docs.forEach(d => weight += (d.data().finalWeight || 0));
      setStats({
        totalWeight: weight / 1000,
        completedCount: snap.size
      });
    };
    fetchStats();

    return () => unsubActive();
  }, [currentUser]);

  const assigned = clusters.filter(c => ["claimed", "arriving"].includes(c.marketplaceStatus));
  const currentLoad = assigned.reduce((acc, c) => acc + (c.totalWeight || 0), 0) / 1000;

  async function handleStatusUpdate(clusterId, status) {
    try {
      await updatePickupStatus(clusterId, status);
    } catch (err) {
      alert("Failed to update status: " + err);
    }
  }

  async function confirmSchedule() {
    if (!scheduleData.date || !scheduleData.time || !scheduleData.location || !scheduleData.contactName || !scheduleData.contactNumber) {
      alert("Please fill all fields!");
      return;
    }
    try {
      await updatePickupStatus(schedulingCluster.id, "arriving", scheduleData);
      setSchedulingCluster(null);
      setScheduleData({ date: "", time: "", location: "", contactName: "", contactNumber: "" });
    } catch (err) {
      alert("Failed to set arrival schedule: " + err);
    }
  }

  function handleCompleteClick(clusterId) {
    setQrVerifyingCluster(clusterId);
    setQrStatus("idle");
  }

  function simulateScan() {
    setQrStatus("scanning");
    setTimeout(() => {
      setQrStatus("success");
    }, 2500);
  }

  async function executeCompletion() {
    if (!qrVerifyingCluster) return;
    setProcessing(qrVerifyingCluster);
    try {
      const summary = await completePickup(qrVerifyingCluster);
      navigate(`/recycler/receipt/${qrVerifyingCluster}`, { state: { summary } });
    } catch (err) {
      alert("Failed to complete pickup: " + err);
    } finally {
      setProcessing(null);
      setQrVerifyingCluster(null);
      setQrStatus("idle");
    }
  }

  function handleOpenMaps(lat, lon) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, "_blank");
  }

  return (
    <div className="main-content animate-fade-in-up mesh-bg">
      <section className="dash-hero-container" style={{ marginBottom: '2rem' }}>
        <div className="dash-hero glass" style={{ 
          minHeight: '320px', 
          background: 'linear-gradient(135deg, rgba(5, 44, 20, 0.9) 0%, rgba(0, 0, 0, 0.9) 100%), url("/images/recycler_hero.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div className="dash-hero-content" style={{ position: 'relative', zIndex: 2 }}>
            <div className="welcome-badge text-glow" style={{marginBottom: '0.75rem'}}>Recycler Portal </div>
            <h1 style={{ fontSize: '3.5rem' }}>Recycler<span className="text-glow">Network.</span></h1>
            <p style={{ maxWidth: '500px', fontSize: '1.1rem' }}>View active collection zones, claim pickups, and complete recycling requests efficiently.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <Link to="/recycler/marketplace" className="btn btn-primary glow-primary" style={{ padding: '0.8rem 2rem', fontSize: '0.85rem' }}>Browse Marketplace</Link>
                <Link to="/recycler/map" className="btn btn-outline" style={{ padding: '0.8rem 2rem', fontSize: '0.85rem' }}>Network Map</Link>
            </div>
          </div>
          
          {/* Truck Image Integration */}
          <div style={{ 
            position: 'absolute', 
            right: '-5%', 
            bottom: '-10%', 
            width: '600px', 
            height: '100%', 
            backgroundImage: 'url("/images/truck.png")',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'bottom right',
            opacity: 0.6,
            zIndex: 1,
            filter: 'drop-shadow(0 0 50px var(--clr-primary-glow))'
          }} />
        </div>
      </section>

      {/* Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="dash-card glass glow-hover" style={{ padding: '1.5rem', borderLeft: '4px solid var(--clr-primary)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Total Recovered</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '0.5rem' }}>{stats.totalWeight.toFixed(1)} <small style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--clr-primary)' }}>kg</small></div>
        </div>
        <div className="dash-card glass glow-hover" style={{ padding: '1.5rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Missions</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '0.5rem' }}>{stats.completedCount}</div>
        </div>
        <div className="dash-card glass glow-hover" style={{ padding: '1.5rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Active Load</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '0.5rem' }}>{currentLoad.toFixed(1)} <small style={{ fontSize: '0.8rem', fontWeight: 400, color: '#F59E0B' }}>kg</small></div>
        </div>
        <div className="dash-card glass glow-hover" style={{ padding: '1.5rem', borderLeft: '4px solid #A855F7' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Eco-Rating</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '0.5rem' }}>4.9 <span style={{ color: '#A855F7', fontSize: '1.2rem' }}>★</span></div>
        </div>
      </div>

      <div className="dash-card glass" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 className="display-font" style={{ fontSize: '1.5rem' }}>Current Route Missions</h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{assigned.length} Active Jobs</div>
        </div>

        {assigned.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--clr-border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
            <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1.5rem' }}>No active missions. Your claimed pickups will appear here.</p>
            <Link to="/recycler/marketplace" className="btn btn-outline" style={{ fontSize: '0.8rem' }}>Claim from Marketplace</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {assigned.map((c, i) => {
              const isArriving = c.marketplaceStatus === "arriving";
              return (
                <div key={c.id} className="animate-fade-in-up glow-hover" style={{ 
                  display: 'flex', alignItems: 'center', gap: '2rem', padding: '1.5rem 2rem', 
                  background: isArriving ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isArriving ? '#F59E0B' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '20px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div style={{ width: '45px', height: '45px', background: isArriving ? '#F59E0B' : 'var(--clr-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#000' }}>{i + 1}</div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{c.name}</h4>
                      <span style={{ fontSize: '0.65rem', background: isArriving ? '#F59E0B22' : 'var(--clr-primary-glow)', color: isArriving ? '#F59E0B' : 'var(--clr-primary)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 800 }}>
                        {c.marketplaceStatus.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                      <span onClick={() => handleOpenMaps(c.latitude, c.longitude)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>📍 Navigation Link</span>
                      <span>⚖️ {(c.totalWeight / 1000).toFixed(1)}kg verified</span>
                    </div>
                    {c.arrivalDate ? (
                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--clr-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '6px', display: 'inline-flex' }}>
                        <span>📅 {c.arrivalDate} at {c.arrivalTime}</span>
                        <span>📍 {c.pickupLocation}</span>
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {!isArriving ? (
                      <button 
                        className="btn btn-outline" 
                        onClick={() => {
                          setSchedulingCluster(c);
                          setScheduleData({ 
                            date: "", 
                            time: "", 
                            location: "", 
                            contactName: userData?.companyName || userData?.name || "",
                            contactNumber: userData?.phone || ""
                          });
                        }}
                        style={{ padding: '0.6rem 1.2rem', fontSize: '0.75rem' }}
                      >
                        ⚡ Mark Arriving
                      </button>
                    ) : (
                      <div style={{ color: '#F59E0B', fontSize: '0.8rem', fontWeight: 700, padding: '0 1rem' }}>In-Transit...</div>
                    )}
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleCompleteClick(c.id)}
                      disabled={processing === c.id}
                      style={{ padding: '0.6rem 1.2rem', fontSize: '0.75rem' }}
                    >
                      {processing === c.id ? "⌛" : "✓ Complete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Arrival Scheduling Modal */}
      {schedulingCluster && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="dash-card glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="display-font">Schedule Arrival</h2>
              <button className="btn btn-outline" onClick={() => setSchedulingCluster(null)} style={{ padding: '0.5rem 1rem' }}>Cancel</button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>Arrival Date</label>
              <input type="date" value={scheduleData.date} onChange={e => setScheduleData({...scheduleData, date: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>Approximate Time</label>
              <input type="time" value={scheduleData.time} onChange={e => setScheduleData({...scheduleData, time: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>Meeting Location</label>
              <input type="text" placeholder="e.g. Main Gate, Reception Area" value={scheduleData.location} onChange={e => setScheduleData({...scheduleData, location: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>Contact Name</label>
                <input type="text" placeholder="Your Name" value={scheduleData.contactName} onChange={e => setScheduleData({...scheduleData, contactName: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>Contact Number</label>
                <input type="tel" placeholder="Phone" value={scheduleData.contactNumber} onChange={e => setScheduleData({...scheduleData, contactNumber: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
              </div>
            </div>

            <button className="btn btn-primary" onClick={confirmSchedule} style={{ width: '100%', padding: '1rem' }}>Confirm & Mark Arriving</button>
          </div>
        </div>
      )}
      {/* QR Verification Modal */}
      {qrVerifyingCluster && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(5px)' }}>
          <div className="dash-card glass animate-fade-in-up" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', textAlign: 'center', border: `1px solid ${qrStatus === 'success' ? 'var(--clr-primary)' : 'rgba(255,255,255,0.1)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="display-font" style={{ fontSize: '1.5rem' }}>Verify Pickup</h2>
              <button className="btn btn-outline" onClick={() => { setQrVerifyingCluster(null); setQrStatus("idle"); }} style={{ padding: '0.4rem 0.8rem', border: 'none' }}>✕</button>
            </div>
            
            <p style={{ color: 'var(--clr-text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              {qrStatus === "idle" && "Scan the resident's QR code to verify this collection."}
              {qrStatus === "scanning" && "Analyzing QR Code..."}
              {qrStatus === "success" && "Verification Successful! Ready to complete."}
            </p>

            <div style={{ 
              width: '200px', 
              height: '200px', 
              margin: '0 auto 2rem', 
              border: `2px ${qrStatus === 'success' ? 'solid var(--clr-primary)' : 'dashed rgba(255,255,255,0.2)'}`,
              borderRadius: '16px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
              overflow: 'hidden',
              boxShadow: qrStatus === 'success' ? '0 0 30px rgba(34,197,94,0.2)' : 'none'
            }}>
              {qrStatus === "idle" && (
                <div style={{ fontSize: '4rem', opacity: 0.5 }}>📱</div>
              )}
              
              {qrStatus === "scanning" && (
                <>
                  <div style={{ fontSize: '4rem', opacity: 0.8 }}>📱</div>
                  <div className="scanner-line" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--clr-primary)', boxShadow: '0 0 10px var(--clr-primary-glow)' }} />
                </>
              )}

              {qrStatus === "success" && (
                <div style={{ fontSize: '5rem', color: 'var(--clr-primary)', animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>✓</div>
              )}
            </div>

            {qrStatus === "idle" && (
              <button className="btn btn-outline" onClick={simulateScan} style={{ width: '100%', padding: '1rem' }}>
                Simulate Scan
              </button>
            )}

            {qrStatus === "success" && (
              <button className="btn btn-primary glow-primary" onClick={executeCompletion} disabled={processing === qrVerifyingCluster} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                {processing === qrVerifyingCluster ? "Processing..." : "Complete Pickup"}
              </button>
            )}

          </div>
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .scanner-line {
          animation: scanLine 2s linear infinite;
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
