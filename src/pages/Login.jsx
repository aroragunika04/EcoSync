import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, resetPassword } from "../services/authService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      
      // Fetch the user's role to determine redirect destination
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;

      if (userData?.role === "recycler") {
        navigate("/recycler/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Try again later.");
      } else {
        setError("Login failed: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  }
  
  async function handleReset() {
    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }
    setError("");
    setMessage("");
    try {
      await resetPassword(email);
      setMessage("Check your inbox for reset instructions.");
    } catch (err) {
      console.error(err);
      setError("Failed to send reset email: " + err.message);
    }
  }

  return (
    <div className="split-layout">
      {/* Left Side: Image */}
      <div className="split-left">
        <img src="/images/tech_hero.png" alt="Tech" className="split-bg-img" />
        <div className="split-glass" />
        <div className="split-content">
          <h1 className="display-font">Closing the<br/><span>E-Waste</span> Loop.</h1>
          <p>Join EcoSync to easily track your e-waste, monitor community progress, and reduce your environmental footprint.</p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="split-right">
        <div className="auth-box">
          <h2 className="auth-title display-font">Welcome Back</h2>
          <p className="auth-subtitle">Enter your details to log in.</p>
          
          {error && <div style={{color: "var(--clr-error)", fontSize: "0.85rem", marginBottom: "1rem", textAlign: "center"}}>{error}</div>}
          {message && <div style={{color: "var(--clr-primary)", fontSize: "0.85rem", marginBottom: "1rem", textAlign: "center"}}>{message}</div>}

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
              <div style={{display: "flex", justifyContent: "space-between"}}>
                <label className="form-label">Password</label>
                <button 
                  type="button"
                  onClick={handleReset}
                  style={{fontSize: "0.75rem", color: "var(--clr-primary)", fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer"}}
                >
                  Request Reset?
                </button>
              </div>
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
            
            <button className="btn btn-primary btn-block" style={{marginTop: "1rem", padding: "0.9rem"}} type="submit" disabled={loading}>
              {loading ? "Authenticating..." : "Log In →"}
            </button>
            
            <p className="auth-subtitle" style={{marginTop: "1.5rem", marginBottom: 0}}>
              Don't have an account? <Link to="/signup" style={{color: "var(--clr-primary)", borderBottom: "1px solid var(--clr-primary)"}}>Sign Up</Link>
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
