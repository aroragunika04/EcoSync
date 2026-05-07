import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { assignUserCluster } from "../services/authService";
import LocationDetector from "../components/LocationDetector";

export default function Onboarding() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [clusterCode, setClusterCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleClusterSelected(code) {
    setLoading(true);
    setError("");
    try {
      await assignUserCluster(currentUser.uid, code);
      localStorage.setItem("clusterId", code);
      
      // Brief delay to allow the user to see the confirmation UI if assigned via detector
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Failed to link to the network. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!clusterCode.trim()) {
      setError("Please enter a valid collection point code.");
      return;
    }
    handleClusterSelected(clusterCode.trim());
  }

  return (
    <div className="split-layout">
      {/* Left Side: Image */}
      <div className="split-left">
        <img src="/images/tech_hero.png" alt="Tech" className="split-bg-img" />
        <div className="split-glass" />
        <div className="split-content">
          <h1 className="display-font">Initialize<br/><span>Node.</span></h1>
          <p>You have successfully authenticated. Please provide your designated collection point code to interface with the global ledger.</p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="split-right">
        <div className="auth-box">
          <h2 className="auth-title display-font">Network Link</h2>
          <LocationDetector uid={currentUser.uid} onSelectCluster={handleClusterSelected} />

          <div style={{margin: "2rem 0", display: "flex", alignItems: "center", gap: "1rem"}}>
            <div style={{flex: 1, height: "1px", background: "var(--clr-border)"}}></div>
            <span style={{fontSize: "0.7rem", color: "var(--clr-text-muted)", textTransform: "uppercase"}}>OR</span>
            <div style={{flex: 1, height: "1px", background: "var(--clr-border)"}}></div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Manual Link (Enter Code)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. cluster_hq_01" 
                value={clusterCode}
                onChange={e => setClusterCode(e.target.value)}
              />
            </div>
            
            <button className="btn btn-primary btn-block" style={{marginTop: "1rem", padding: "0.8rem", fontSize: "0.85rem"}} type="submit" disabled={loading}>
              {loading ? "Verifying link..." : "Link via Code"}
            </button>
          </form>
        </div>
        
        <div style={{position: "absolute", bottom: "2rem", width: "100%", textAlign: "center", color: "var(--clr-text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-display)"}}>
          CONNECTION PENDING
        </div>
      </div>
    </div>
  );
}
