import { useState, useEffect } from "react";
import { getNearbyClusters, geocodeCity, assignNearestCluster, getReverseGeocode, getClustersInArea } from "../services/clusterService";

export default function LocationDetector({ uid, onSelectCluster }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [clusters, setClusters] = useState([]);
  const [assigned, setAssigned] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [searchCoords, setSearchCoords] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [status, setStatus] = useState("Finding nearby pickup point...");

  useEffect(() => {
    detectLocation();
  }, []);

  async function detectLocation() {
    setLoading(true);
    setError(false);
    setStatus("Finding nearby pickup point...");

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      handleManualFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const [fetched, name] = await Promise.all([
            getNearbyClusters(latitude, longitude),
            getReverseGeocode(latitude, longitude)
          ]);
          setClusters(fetched);
          setLocationName(name);
          setHasSearched(true);
          setLoading(false);
        } catch (err) {
          console.error("Cluster fetch failed", err);
          setError(true);
          setLoading(false);
        }
      },
      (err) => {
        console.warn("Geolocation permission denied or failed", err);
        setHasSearched(false); // Ensure we show manual form
        handleManualFallback();
      }
    );
  }

  async function handleAutoAssign(overrideCoords = null) {
    if (!navigator.geolocation && !overrideCoords) return;
    
    setLoading(true);
    setStatus("Syncing with nearest network node...");
    
    const performAssignment = async (lat, lon) => {
      try {
        const [result, name] = await Promise.all([
          assignNearestCluster(uid, lat, lon),
          getReverseGeocode(lat, lon)
        ]);
        setAssigned(result);
        setLocationName(name);
        if (onSelectCluster) onSelectCluster(result.cluster.id);
      } catch (err) {
        console.error("Assignment failed", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (overrideCoords) {
      await performAssignment(overrideCoords.lat, overrideCoords.lon);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => performAssignment(position.coords.latitude, position.coords.longitude),
      () => handleManualFallback()
    );
  }

  function handleManualFallback() {
    setLoading(false);
    setError(true);
    setStatus("Manual Location Input Required");
  }

  async function handleManualSearch(e) {
    e.preventDefault();
    if (!manualInput.trim()) return;

    setLoading(true);
    setError(false);
    setStatus(`Searching for "${manualInput}"...`);
    
    const result = await geocodeCity(manualInput);
    if (result && result.bbox) {
      try {
        const [fetched, name] = await Promise.all([
          getClustersInArea(result.bbox, result.lat, result.lon),
          getReverseGeocode(result.lat, result.lon)
        ]);
        setClusters(fetched);
        setLocationName(name);
        setSearchCoords({ lat: result.lat, lon: result.lon });
        setHasSearched(true);
      } catch (err) {
        console.error("Manual cluster fetch failed", err);
      }
    } else {
      setStatus("Location not found. Try a different city.");
    }
    setLoading(false);
  }

  return (
    <div className="location-detector">
      {loading ? (
        <div className="loading-state">
          <div className="pulse-indicator"></div>
          <p className="auth-subtitle">{status}</p>
        </div>
      ) : (
        <div className="results-container">
          {assigned ? (
            <div className="assignment-confirmation" style={{ textAlign: "center", padding: "1rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
              <h3 className="display-font" style={{ color: "var(--clr-primary)", marginBottom: "0.5rem" }}>
                Identity Linked
              </h3>
              <p className="auth-subtitle">
                You are assigned to <strong>{assigned.cluster.name}</strong>
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)", marginTop: "0.25rem" }}>
                Location: {locationName}
              </p>
              {assigned.distance > 0 && (
                <p style={{ fontSize: "0.85rem", color: "var(--clr-accent)", marginTop: "0.5rem" }}>
                  📍 {assigned.distance.toFixed(2)} km from your location
                </p>
              )}
              <div className="pulse-indicator" style={{ marginTop: "1.5rem" }}></div>
              <p style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", marginTop: "0.5rem" }}>
                Initializing secure link...
              </p>
            </div>
          ) : !hasSearched || error ? (
            <div className="manual-fallback">
              {error && (
                <div className="error-banner">
                  <span className="icon">⚠️</span>
                  <p>Location access denied or unavailable. Manual entry required.</p>
                </div>
              )}
              
              <form onSubmit={handleManualSearch} className="manual-search-form">
                <div className="form-group">
                  <label className="form-label">Search by City / Area</label>
                  <div style={{display: "flex", gap: "0.5rem"}}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. San Francisco" 
                      value={manualInput}
                      onChange={e => setManualInput(e.target.value)}
                    />
                    <button className="btn btn-outline" type="submit" style={{padding: "0 1.5rem"}}>Search</button>
                  </div>
                </div>
              </form>
            </div>
          ) : clusters.length > 0 ? (
            <div className="nearby-clusters">
              <div style={{marginBottom: "1rem"}}>
                <div style={{fontSize: "0.7rem", color: "var(--clr-accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem"}}>Detected Near</div>
                <div style={{fontSize: "1.1rem", fontWeight: 700, color: "#fff"}}>{locationName}</div>
              </div>

              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem"}}>
                <h3 className="form-label" style={{ color: "var(--clr-primary)", margin: 0 }}>
                  Nodes Detected ({clusters.length})
                </h3>
                <button className="btn btn-primary" style={{padding: "0.4rem 0.8rem", fontSize: "0.7rem"}} onClick={handleAutoAssign}>
                  Auto-Link Nearest Node
                </button>
              </div>
              <div className="cluster-list">
                {clusters.map((cluster) => (
                  <div 
                    key={cluster.id} 
                    className="cluster-item-row"
                    onClick={() => onSelectCluster(cluster.id)}
                  >
                    <div className="cluster-info">
                      <div className="item-label">{cluster.name}</div>
                      <div className="auth-subtitle" style={{margin: 0, fontSize: "0.75rem"}}>
                        {cluster.distance.toFixed(2)} km away
                      </div>
                    </div>
                    <div className="cluster-action">
                      <span className="arrow">→</span>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                className="btn btn-outline btn-block" 
                style={{marginTop: "1.5rem", fontSize: "0.75rem"}}
                onClick={() => {setClusters([]); setError(true);}}
              >
                Not your location? Search manually
              </button>
            </div>
          ) : (
            <div className="no-clusters" style={{textAlign: "center", padding: "1rem"}}>
              <p className="auth-subtitle">No pickup points found in this area.</p>
              <button 
                className="btn btn-primary btn-block" 
                style={{marginBottom: "1rem"}}
                onClick={() => handleAutoAssign(searchCoords)}
              >
                Initialize New Network Node in {locationName || manualInput}
              </button>
              <button 
                className="btn btn-outline btn-block" 
                onClick={() => {setError(false); setClusters([]); setSearchCoords(null); setHasSearched(false);}}
              >
                Try manual search
              </button>
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .location-detector {
          margin-top: 1rem;
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 0;
        }
        .cluster-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .cluster-item-row {
          background: var(--clr-bg-alt);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-sm);
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all var(--transition);
        }
        .cluster-item-row:hover {
          border-color: var(--clr-primary);
          background: rgba(16, 185, 129, 0.05);
          transform: translateX(4px);
        }
        .cluster-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .cluster-action {
          color: var(--clr-primary);
          font-weight: 700;
          opacity: 0.5;
        }
        .cluster-item-row:hover .cluster-action {
          opacity: 1;
        }
        .manual-search-form .form-input {
          flex: 1;
        }
        .error-banner {
          background: var(--clr-error-bg);
          border: 1px solid var(--clr-error);
          border-radius: var(--radius-sm);
          padding: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          color: var(--clr-error);
        }
      `}} />
    </div>
  );
}
