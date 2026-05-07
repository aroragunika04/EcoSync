import { useEffect, useState, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/authService";

export default function Navbar() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const isRecycler = userData?.role === "recycler";

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand-logo">
        <img src="/images/ecosync_logo.png" alt="EcoSync Logo" className="nav-logo-img" />
        <div className="nav-brand-text">
          EcoSync
          <span className="brand-dot"></span>
        </div>
      </Link>

      <div className="nav-center">
        {isRecycler ? (
          <>
            <NavLink to="/recycler/dashboard" className="nav-link">Dashboard</NavLink>
            <NavLink to="/recycler/marketplace" className="nav-link">Marketplace</NavLink>
            <NavLink to="/recycler/map" className="nav-link">Network Map</NavLink>
            <NavLink to="/recycler/history" className="nav-link">History</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
            <NavLink to="/impact" className="nav-link">Impact</NavLink>
            <NavLink to="/waste-guide" className="nav-link">Waste-Guide</NavLink>
          </>
        )}
      </div>

      <div className="nav-right">
        {isRecycler && (
          <div className="recycler-badge-nav">♻️ Recycler</div>
        )}
        <div className="nav-notifications" style={{ position: 'relative', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1rem', filter: 'grayscale(1) brightness(2)' }}>🔔</span>
        </div>

        {currentUser ? (
          <div className="nav-profile-container" ref={dropdownRef}>
            <div
              className="user-profile-section"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                background: showDropdown ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                padding: '0.3rem 0.8rem 0.3rem 0.3rem', borderRadius: '30px',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="profile-img-wrapper" style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`} alt="Avatar" style={{ width: '100%', height: '100%' }} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff' }}>{currentUser.email?.split('@')[0]}</span>
              <span style={{ fontSize: '0.6rem', opacity: 0.5, transition: 'transform 0.2s ease', transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </div>

            {showDropdown && (
              <div className="nav-dropdown">
                <div style={{ padding: '0.5rem 1rem 0.8rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{currentUser.email?.split('@')[0]}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.email}</div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <span>🚪</span> Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
