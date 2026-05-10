import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Impact from "./pages/Impact";
import WasteGuide from "./pages/WasteGuide";
import RecyclerDashboard from "./pages/RecyclerDashboard";
import RecyclerMarketplace from "./pages/RecyclerMarketplace";
import RecyclerMap from "./pages/RecyclerMap";
import PickupHistory from "./pages/PickupHistory";
import PickupReceipt from "./pages/PickupReceipt";

function ProtectedRoute({ children, requireCluster = true }) {
  const { currentUser, userData } = useAuth();
  
  if (!currentUser) return <Navigate to="/signup" />;

  // Recyclers should not access resident routes — redirect them
  if (userData && userData.role === "recycler") {
    return <Navigate to="/recycler/dashboard" />;
  }

  if (requireCluster && userData && !userData.clusterId) {
    return <Navigate to="/onboarding" />;
  }

  if (!requireCluster && userData && userData.clusterId) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function RecyclerRoute({ children }) {
  const { currentUser, userData } = useAuth();

  if (!currentUser) return <Navigate to="/signup" />;

  // Normal users cannot access recycler routes
  if (userData && userData.role !== "recycler") {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { currentUser, userData } = useAuth();
  
  if (currentUser) {
    if (userData?.role === "recycler") {
      return <Navigate to="/recycler/dashboard" />;
    }
    const isReady = userData && userData.clusterId;
    return isReady ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />;
  }
  return children;
}

export default function App() {
  const location = useLocation();
  const hideNavAndFooter = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="app-container">
      {!hideNavAndFooter && <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/signup" />} />
          
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          
          <Route path="/onboarding" element={
            <ProtectedRoute requireCluster={false}><Onboarding /></ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute requireCluster={true}><Dashboard /></ProtectedRoute>
          } />
          <Route path="/impact" element={
            <ProtectedRoute requireCluster={true}><Impact /></ProtectedRoute>
          } />
          <Route path="/waste-guide" element={
            <ProtectedRoute requireCluster={true}><WasteGuide /></ProtectedRoute>
          } />

          {/* Recycler Routes */}
          <Route path="/recycler/dashboard" element={
            <RecyclerRoute><RecyclerDashboard /></RecyclerRoute>
          } />
          <Route path="/recycler/marketplace" element={
            <RecyclerRoute><RecyclerMarketplace /></RecyclerRoute>
          } />
          <Route path="/recycler/map" element={
            <RecyclerRoute><RecyclerMap /></RecyclerRoute>
          } />
          <Route path="/recycler/history" element={
            <RecyclerRoute><PickupHistory /></RecyclerRoute>
          } />
          <Route path="/recycler/receipt/:pickupId" element={
            <RecyclerRoute><PickupReceipt /></RecyclerRoute>
          } />
        </Routes>
      </main>
      {!hideNavAndFooter && <Footer />}
    </div>
  );
}
