import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { logWaste } from "../services/wasteService";

const WEIGHT_LIBRARY = [
  { label: "Mechanical Keyboard", weight: 0.6 },
  { label: "Slim Keyboard", weight: 0.3 },
  { label: "Keyboard", weight: 0.5 },
  { label: "Standard Monitor", weight: 4.0 },
  { label: "Ultrawide Monitor", weight: 7.0 },
  { label: "Laptop", weight: 2.5 },
  { label: "Tablet", weight: 0.5 },
  { label: "Phone", weight: 0.2 },
  { label: "Charger", weight: 0.15 },
  { label: "Mouse", weight: 0.1 },
  { label: "Battery", weight: 0.05 },
  { label: "Headphones", weight: 0.25 },
  { label: "Webcam", weight: 0.15 },
  { label: "USB Hub", weight: 0.1 },
  { label: "Smartwatch", weight: 0.05 },
  { label: "GPU / Graphics Card", weight: 1.2 },
  { label: "Internal Drive", weight: 0.2 },
];

export default function WasteLogger({ isOpen, onClose, initialItem }) {
  const { currentUser, userData } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isManual, setIsManual] = useState(false);
  const [weight, setWeight] = useState(0.1); 
  const [quantity, setQuantity] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setSelectedItem(initialItem);
        setSearchQuery(initialItem.label);
        setWeight(initialItem.weight);
        setQuantity(1);
        setIsManual(false);
      } else {
        setSearchQuery("");
        setSelectedItem(null);
        setWeight(0.1);
        setQuantity(1);
        setIsManual(false);
      }
    }
  }, [isOpen, initialItem]);

  const suggestions = searchQuery.length > 1 
    ? WEIGHT_LIBRARY.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleLog = async () => {
    if (!userData?.clusterId) {
       triggerToast("No cluster assigned!");
       return;
    }
    
    setLoading(true);
    try {
      const displayUserName = currentUser?.email?.split("@")[0] || "EcoUser";
      const itemLabel = isManual ? (searchQuery || "Other Item") : selectedItem?.label;
      const finalWeight = weight;
      
      const userId = currentUser?.uid || "guest";

      const { hitThreshold } = await logWaste({
        userId: userId,
        userName: displayUserName,
        clusterId: userData.clusterId,
        itemType: (itemLabel || "item").toLowerCase(),
        quantity: quantity,
        weight: finalWeight,
      });
      
      if (hitThreshold) {
        triggerToast("Goal reached! Pickup will be scheduled. 🎉");
      } else {
        triggerToast(`+${(finalWeight * quantity * 1000).toFixed(0)}g added to community goal!`);
      }
      
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to log waste. Cluster invalid.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="logger-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="logger-modal advanced-logger">
        <div className="modal-header">
          <h3 className="display-font">Configure Log</h3>
          <p>Please confirm the item details</p>
        </div>

        <div className="manual-toggle-row">
          <span className={`toggle-label ${!isManual ? 'active' : ''}`}>Smart Search</span>
          <div 
            className={`toggle-switch ${isManual ? 'on' : ''}`}
            onClick={() => setIsManual(!isManual)}
          >
            <div className="toggle-handle"></div>
          </div>
          <span className={`toggle-label ${isManual ? 'active' : ''}`}>Manual Weight</span>
        </div>

        {!isManual ? (
          <div className="search-section animate-fadeIn">
            <div className="form-group">
              <input 
                type="text" 
                className="form-input search-input" 
                placeholder="Search items (e.g. Monitor, GPU...)" 
                value={searchQuery}
                onChange={(e) => {
                   setSearchQuery(e.target.value);
                   if (selectedItem && e.target.value !== selectedItem.label) {
                     setSelectedItem(null);
                   }
                }}
                autoFocus={!initialItem}
              />
              
              {!selectedItem && (
                <div className="suggestions-container">
                  {suggestions.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`suggestion-pill ${selectedItem?.label === item.label ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedItem(item);
                        setSearchQuery(item.label);
                        setWeight(item.weight);
                      }}
                    >
                      <span>{item.label}</span>
                      <span className="pill-weight">{(item.weight * 1000)}g</span>
                    </div>
                  ))}
                  {searchQuery.length > 1 && suggestions.length === 0 && (
                    <p className="no-results">No library match. Try manual mode!</p>
                  )}
                </div>
              )}
            </div>

            {selectedItem && (
               <div className="weight-control animate-fadeIn" style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--clr-primary)', textAlign: 'center', marginBottom: '1rem' }}>
                    Estimated weight based on item type. Customize slightly if needed.
                  </p>
                  <div className="weight-display">
                    <span className="weight-val">{(weight * 1000).toFixed(0)}</span>
                    <span className="weight-unit">grams/unit</span>
                  </div>
                  <input 
                    type="range" 
                    min={selectedItem.weight * 0.8} 
                    max={selectedItem.weight * 1.2} 
                    step="0.01" 
                    className="weight-slider" 
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value))}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                    <span>{((selectedItem.weight * 0.8) * 1000).toFixed(0)}g</span>
                    <span>{((selectedItem.weight * 1.2) * 1000).toFixed(0)}g</span>
                  </div>

                  <div className="quantity-control" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Quantity</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--clr-bg-alt)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)' }}>
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', padding: '0 0.5rem' }}>-</button>
                      <span style={{ fontSize: '1.1rem', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', padding: '0 0.5rem' }}>+</button>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--clr-primary)' }}>
                    Total: <b>{((weight * quantity) * 1000).toFixed(0)}g</b> to log
                  </div>
               </div>
            )}
          </div>
        ) : (
          <div className="manual-section animate-fadeIn">
            <div className="form-group">
              <label className="form-label">Item Description</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="What are you logging?" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="weight-control">
              <div className="weight-display">
                <span className="weight-val">{(weight * 1000).toFixed(0)}</span>
                <span className="weight-unit">grams/unit</span>
              </div>
              <input 
                type="range" 
                min="0.01" 
                max="10.0" 
                step="0.01" 
                className="weight-slider" 
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
              />
              <p className="weight-hint" style={{ marginBottom: '1.5rem' }}>
                {weight < 0.5 ? "Small impact, big difference! 🌱" : "Significant recovery, thank you! 🌿"}
              </p>

              <div className="quantity-control" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Quantity</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--clr-bg-alt)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)' }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', padding: '0 0.5rem' }}>-</button>
                  <span style={{ fontSize: '1.1rem', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', padding: '0 0.5rem' }}>+</button>
                </div>
              </div>
              <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--clr-primary)' }}>
                Total: <b>{((weight * quantity) * 1000).toFixed(0)}g</b> to log
              </div>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            disabled={loading || (!isManual && !selectedItem)}
            onClick={handleLog}
          >
            {loading ? "Logging..." : "Confirm & Log"}
          </button>
        </div>
      </div>

      {toast && <div className="quick-toast animate-fadeInUp">{toast}</div>}
    </div>
  );
}
