import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { logWaste } from "../services/wasteService";

const ITEMS = [
  { label: "Phone", value: "phone", weight: 0.2, icon: "📱" },
  { label: "Battery", value: "battery", weight: 0.1, icon: "🔋" },
  { label: "Cable", value: "cable", weight: 0.05, icon: "🔌" },
  { label: "Laptop", value: "laptop", weight: 2.5, icon: "💻" },
  { label: "Component", value: "board", weight: 0.5, icon: "🧩" },
  { label: "Display", value: "monitor", weight: 4.0, icon: "🖥️" },
];

export default function WasteForm({ onLogged }) {
  const { currentUser, userData } = useAuth();
  const [itemType, setItemType] = useState("");
  const [status, setStatus] = useState("idle");

  const selectedItem = ITEMS.find((i) => i.value === itemType);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!itemType || !selectedItem) return;

    setStatus("loading");
    try {
      await logWaste({
        userId: currentUser.uid,
        clusterId: userData.clusterId,
        itemType: selectedItem.value,
        quantity: 1,
        weight: selectedItem.weight,
      });
      setStatus("success");
      setItemType("");
      if (onLogged) onLogged();
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <div className="deposit-form-container">
      <div className="deposit-card">
        <div className="deposit-header">
          <div className="deposit-icon-top">✅</div>
          <h2 className="display-font">Log Waste</h2>
          <p>Select a common item to register it to the collection point.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="item-grid">
            {ITEMS.map((item) => (
              <div 
                key={item.value} 
                className={`item-card ${itemType === item.value ? 'active' : ''}`}
                onClick={() => setItemType(item.value)}
              >
                <div className="item-icon">{item.icon}</div>
                <div className="item-label">{item.label}</div>
              </div>
            ))}
          </div>

          <div style={{textAlign: "center", marginTop: "1rem"}}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={status === "loading" || status === "success" || !itemType}
              style={{padding: "1rem 3rem", fontSize: "1.05rem", width: "100%"}}
            >
              {status === "loading" ? "Processing..." : status === "success" ? "Logged ✅" : "Log Item Now ⇡"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
