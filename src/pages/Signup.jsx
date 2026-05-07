import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../services/authService";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signup(email, password, role);
      // Recyclers skip onboarding (no cluster needed), users go to onboarding
      navigate(role === "recycler" ? "/recycler/dashboard" : "/onboarding");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Signup failed: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="split-layout">
      {/* Left Side: Image */}
      <div className="split-left">
        <img src="/images/tech_hero.png" alt="Tech" className="split-bg-img" />
        <div className="split-glass" />
        <div className="split-content">
          <h1 className="display-font">
            {role === "recycler" ? <>Join the<br/><span>Network.</span></> : <>Track Your<br/><span>Impact.</span></>}
          </h1>
          <p>
            {role === "recycler"
              ? "Sign up as a recycler to manage pickups, browse the marketplace, and help close the e-waste loop."
              : "Join EcoSync to easily track your e-waste, monitor community progress, and reduce your environmental footprint."}
          </p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="split-right">
        <div className="auth-box">
          <h2 className="auth-title display-font">Create Account</h2>
          <p className="auth-subtitle">Select your role and sign up.</p>
          
          {/* Role Toggle */}
          <div className="role-toggle">
            <button
              type="button"
              className={`role-toggle-btn ${role === "user" ? "active" : ""}`}
              onClick={() => setRole("user")}
            >
              <span className="role-toggle-icon">🏠</span>
              Resident
            </button>
            <button
              type="button"
              className={`role-toggle-btn ${role === "recycler" ? "active" : ""}`}
              onClick={() => setRole("recycler")}
            >
              <span className="role-toggle-icon">♻️</span>
              Recycler
            </button>
          </div>

          {error && <div style={{color: "var(--clr-error)", fontSize: "0.85rem", marginBottom: "1rem", textAlign: "center"}}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="you@example.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <span className="icon">🔒</span>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-with-icon">
                <span className="icon">🔒</span>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Re-enter key" 
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <button className="btn btn-primary btn-block" style={{marginTop: "1.5rem", padding: "0.9rem"}} type="submit" disabled={loading}>
              {loading ? "Creating Account..." : `Sign Up as ${role === "recycler" ? "Recycler" : "Resident"} →`}
            </button>
            
            <p className="auth-subtitle" style={{marginTop: "1.5rem", marginBottom: 0}}>
              Already have an account? <Link to="/login" style={{color: "var(--clr-primary)", borderBottom: "1px solid var(--clr-primary)"}}>Log In</Link>
            </p>
          </form>
        </div>
        
        <div style={{position: "absolute", bottom: "2rem", width: "100%", textAlign: "center", color: "var(--clr-text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-display)"}}>
          SECURE CONNECTION
        </div>
      </div>
    </div>
  );
}
