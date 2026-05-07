import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet marker icons
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to auto-center map
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function RecyclerMap() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(collection(db, "clusters"), (snap) => {
      setClusters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  const mapCenter = selectedCluster 
    ? [selectedCluster.latitude, selectedCluster.longitude] 
    : clusters.length > 0 && clusters[0].latitude 
      ? [clusters[0].latitude, clusters[0].longitude] 
      : [28.6139, 77.2090];

  return (
    <div className="main-content animate-fade-in-up" style={{ padding: 0, height: 'calc(100vh - 100px)', display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div className="map-sidebar glass" style={{ width: '420px', borderRight: '1px solid var(--clr-border)', display: 'flex', flexDirection: 'column', zIndex: 10, position: 'relative' }}>
        <div style={{ padding: '2.5rem 2rem' }}>
          <div className="welcome-badge text-glow" style={{ marginBottom: '0.5rem' }}>Live Grid 📡</div>
          <h2 className="display-font" style={{ fontSize: '2.2rem' }}>Network<span className="text-glow">Map.</span></h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--clr-text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>Real-time monitoring of all active clusters in the region.</p>
        </div>

        <div className="cluster-list" style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 2rem' }}>
          {clusters.sort((a, b) => (b.totalWeight / b.threshold) - (a.totalWeight / a.threshold)).map(c => {
            const progress = Math.min((c.totalWeight / c.threshold) * 100, 100);
            const isReady = c.status === "scheduled";
            
            return (
              <div 
                key={c.id} 
                onClick={() => setSelectedCluster(c)}
                className={selectedCluster?.id === c.id ? "glow-primary" : ""}
                style={{ 
                  padding: '1.25rem', 
                  borderRadius: '20px', 
                  background: selectedCluster?.id === c.id ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${selectedCluster?.id === c.id ? 'var(--clr-primary)' : 'rgba(255, 255, 255, 0.05)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name || `Node ${c.id.substring(0,4)}`}</span>
                  <span style={{ fontSize: '0.75rem', color: isReady ? 'var(--clr-primary)' : 'var(--clr-text-muted)', fontWeight: 700 }}>
                    {isReady ? 'READY' : 'COLLECTING'}
                  </span>
                </div>
                <div className="goal-bar-container" style={{ height: '4px', marginBottom: '0.5rem' }}>
                  <div className="goal-bar-fill" style={{ width: `${progress}%`, background: isReady ? 'var(--clr-primary)' : 'var(--clr-text-muted)' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{(c.totalWeight / 1000).toFixed(1)}kg</span>
                  <span>{progress.toFixed(0)}% full</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map View */}
      <div className="map-canvas-container" style={{ flex: 1, position: 'relative', background: '#080808' }}>
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles-dark"
          />
          <ChangeView center={mapCenter} />
          {clusters.map(c => {
            const progress = c.totalWeight && c.threshold ? (c.totalWeight / c.threshold) : 0;
            const progressPct = Math.min(progress * 100, 100);
            
            let color = "#EF4444"; // Red
            if (["claimed", "arriving"].includes(c.marketplaceStatus)) color = "#3B82F6"; // Blue
            else if (c.marketplaceStatus === "available" || c.totalWeight >= c.threshold) color = "#10B981"; // Green
            else if (progress >= 0.7) color = "#F59E0B"; // Yellow

            const isClaimed = ["claimed", "arriving"].includes(c.marketplaceStatus);
            const radius = 14 + (Math.min(progress, 1) * 16);
            
            return (
              <CircleMarker 
                key={c.id} 
                center={[c.latitude, c.longitude]} 
                pathOptions={{ 
                  color: '#ffffff', 
                  fillColor: color, 
                  fillOpacity: 0.85, 
                  weight: 2,
                  className: 'pulse-circle'
                }}
                radius={radius}
                eventHandlers={{ click: () => setSelectedCluster(c) }}
              >
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <h4 style={{ margin: '0 0 5px' }}>{c.name}</h4>
                    <p style={{ margin: '0 0 5px', fontSize: '0.8rem', color: '#ccc' }}>Weight: <b>{(c.totalWeight/1000).toFixed(1)}kg</b></p>
                    <p style={{ margin: '0 0 5px', fontSize: '0.8rem', color: '#ccc' }}>Progress: <b>{progressPct.toFixed(0)}%</b></p>
                    <p style={{ margin: '0 0 10px', fontSize: '0.8rem' }}>Status: <b style={{ color }}>{c.marketplaceStatus?.toUpperCase()}</b></p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <button 
                        onClick={() => navigate(isClaimed ? '/recycler/dashboard' : '/recycler/marketplace')}
                        style={{ width: '100%', padding: '8px', background: 'var(--clr-primary)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}
                      >
                        {isClaimed ? "Manage Pickup" : "Claim Job"}
                      </button>
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`, "_blank")}
                        style={{ width: '100%', padding: '8px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        📍 Navigate
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <style>{`
        .leaflet-container {
          background: #0D0D0D;
        }
        .map-tiles-dark {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .leaflet-popup-content-wrapper {
          background: var(--clr-bg-card);
          color: #fff;
          border: 1px solid var(--clr-border);
        }
        .leaflet-popup-tip {
          background: var(--clr-bg-card);
        }
        .pulse-circle {
          animation: pulseMarker 2s infinite alternate;
        }
        @keyframes pulseMarker {
          from { filter: drop-shadow(0 0 4px currentColor); opacity: 0.8; }
          to { filter: drop-shadow(0 0 12px currentColor); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
