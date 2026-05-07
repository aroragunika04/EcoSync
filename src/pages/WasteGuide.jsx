import React, { useState } from 'react';

const WASTE_DATA = [
  {
    id: 1,
    name: "Lithium Battery",
    category: "Batteries",
    toxicity: "High",
    explanation: "Contains hazardous chemicals like lithium and cobalt that can leak into soil and contaminate groundwater. These substances are classified as highly dangerous to both human health and aquatic ecosystems.",
    disposal: "Take to certified e-waste centers or specialized battery drop-off bins. Never puncture, crush, or throw in regular trash — they can cause fires in waste facilities.",
    impact: "Recycling recovers valuable cobalt, nickel, and lithium for reuse in new batteries, reducing the need for destructive mining operations.",
    icon: "🔋"
  },
  {
    id: 2,
    name: "Alkaline Battery",
    category: "Batteries",
    toxicity: "Medium",
    explanation: "Contains zinc and manganese dioxide. While less toxic than lithium, they can still leak corrosive potassium hydroxide that damages soil chemistry.",
    disposal: "Use designated battery recycling tubes found in most retail stores and community centers.",
    impact: "Steel casings and zinc cores are 100% recoverable and can be directly reused in manufacturing.",
    icon: "🔋"
  },
  {
    id: 3,
    name: "Lead-Acid Battery",
    category: "Batteries",
    toxicity: "High",
    explanation: "Large automotive batteries containing lead plates submerged in corrosive sulfuric acid. Extremely hazardous if cracked or improperly stored.",
    disposal: "Return to automotive retailers or specialized hazardous waste centers. Most auto shops accept them for free.",
    impact: "Over 98% of lead is recoverable and reusable in new batteries — one of the most successfully recycled products on Earth.",
    icon: "🔋"
  },
  {
    id: 4,
    name: "Smartphone",
    category: "Electronics",
    toxicity: "Medium",
    explanation: "Circuit boards contain lead and arsenic. Screens use toxic liquid crystals. The compact design makes manual disassembly difficult, concentrating hazardous materials.",
    disposal: "Use manufacturer trade-in programs (Apple, Samsung, etc.) or certified e-waste recyclers. Always factory reset and remove SIM cards first.",
    impact: "Recycling 1 million phones recovers 35,000 lbs of copper, 772 lbs of silver, and 75 lbs of gold.",
    icon: "📱"
  },
  {
    id: 5,
    name: "Laptop",
    category: "Electronics",
    toxicity: "Medium",
    explanation: "Motherboards contain cadmium, chromium, and mercury. Older LCD backlights use mercury vapor tubes. Batteries pose additional chemical risks.",
    disposal: "Donate if functional. Otherwise, remove the battery for separate recycling and take the chassis to an e-waste facility.",
    impact: "Saves the enormous energy required to mine virgin materials and prevents heavy metal contamination of water tables.",
    icon: "💻"
  },
  {
    id: 6,
    name: "CRT Monitor",
    category: "Electronics",
    toxicity: "High",
    explanation: "Old cathode-ray monitors contain 4-8 pounds of lead in the glass funnel, plus phosphor coatings with cadmium. Breaking the glass releases toxic lead dust.",
    disposal: "Must be handled by professional recyclers who can safely extract and process the lead-lined glass in controlled environments.",
    impact: "Prevents lead from entering water supplies where even trace amounts cause neurological damage, especially in children.",
    icon: "📺"
  },
  {
    id: 7,
    name: "Printer",
    category: "Electronics",
    toxicity: "Low",
    explanation: "Mostly plastic and metal construction. However, toner powder contains carbon black particles that are a respiratory irritant, and ink cartridges contain glycol compounds.",
    disposal: "Remove ink/toner cartridges first (recyclable separately at office supply stores). Take the printer frame to any e-waste center.",
    impact: "Recovers large volumes of recyclable plastic and metal, and ensures fine toner particles don't become airborne pollutants.",
    icon: "🖨️"
  },
  {
    id: 8,
    name: "Tablet",
    category: "Electronics",
    toxicity: "Medium",
    explanation: "Similar to smartphones but with larger lithium-polymer batteries that pose greater fire risk. Screens contain indium tin oxide, a finite resource.",
    disposal: "Manufacturer trade-in programs or certified e-waste facility. Factory reset before disposal to protect personal data.",
    impact: "Recovers rare earth elements like neodymium and prevents lithium battery fires in landfills.",
    icon: "📱"
  },
  {
    id: 9,
    name: "Smart Watch",
    category: "Electronics",
    toxicity: "Medium",
    explanation: "Miniaturized electronics packed with sensors, tiny lithium-polymer batteries, and OLED displays using organic compounds that are difficult to separate.",
    disposal: "Specialized small e-waste recycling or manufacturer take-back programs. Most brands offer mail-in recycling.",
    impact: "Recovers silicon, gold traces, and rare earth magnets while preventing micro-battery chemical leakage into soil.",
    icon: "⌚"
  },
  {
    id: 10,
    name: "Circuit Board",
    category: "Accessories",
    toxicity: "High",
    explanation: "Loaded with lead-tin solder, brominated flame retardants (BFRs), and traces of mercury. BFRs are persistent organic pollutants that bioaccumulate in the food chain.",
    disposal: "Store in a dry, sealed container and take to a specialized component recycler. Never burn or crush.",
    impact: "Recovers high-purity gold, palladium, and copper while safely neutralizing hazardous flame retardants.",
    icon: "📟"
  },
  {
    id: 11,
    name: "Hard Drive",
    category: "Accessories",
    toxicity: "Medium",
    explanation: "Control boards contain lead solder. The drive contains powerful neodymium magnets — rare earth elements that are environmentally costly to mine.",
    disposal: "For data security, physically destroy the platters first. Then submit for metal recovery at an e-waste facility.",
    impact: "Recovers aluminum enclosures, stainless steel, and rare earth magnets for reuse in motors and speakers.",
    icon: "💾"
  },
  {
    id: 12,
    name: "Keyboard & Mouse",
    category: "Accessories",
    toxicity: "Low",
    explanation: "Primarily ABS plastic casings with small amounts of copper wiring and micro circuit boards. Mechanical keyboards contain steel springs and plates.",
    disposal: "Standard e-waste drop-off at community centers. Mechanical parts can be salvaged for hobbyist reuse.",
    impact: "Reduces plastic pollution in landfills and recovers usable copper and small amounts of precious metals.",
    icon: "⌨️"
  },
  {
    id: 13,
    name: "Power Cable",
    category: "Accessories",
    toxicity: "Low",
    explanation: "Contains valuable copper wire coated in PVC plastic insulation. Burning cables to extract copper releases extremely toxic dioxins and furans.",
    disposal: "Bundle with other cables and take to e-waste collection points for safe mechanical stripping and metal recovery.",
    impact: "Copper is infinitely recyclable with zero quality loss — recycling cables saves 85% of the energy needed to mine new copper.",
    icon: "🔌"
  },
  {
    id: 14,
    name: "USB Flash Drive",
    category: "Accessories",
    toxicity: "Low",
    explanation: "Small form factor with plastic or metal casing and a tiny PCB with flash memory chips. Contains trace amounts of lead in the solder.",
    disposal: "Securely wipe data using disk utility software, then drop off at small electronics collection bins.",
    impact: "Prevents micro-plastic pollution and recovers trace precious metals from the NAND flash memory chips.",
    icon: "💾"
  },
  {
    id: 15,
    name: "Gaming Headset",
    category: "Accessories",
    toxicity: "Low",
    explanation: "Contains copper voice coils, neodymium driver magnets, and large ABS plastic ear cups. USB models include small circuit boards.",
    disposal: "E-waste drop-off point. Remove fabric or foam ear pads (regular trash) before recycling the electronics.",
    impact: "Recovers high-grade copper wiring and powerful magnets, reducing demand for rare earth mining.",
    icon: "🎧"
  }
];

const CATEGORIES = [
  { name: "Batteries", icon: "🔋", color: "#EF4444" },
  { name: "Electronics", icon: "📱", color: "#3B82F6" },
  { name: "Accessories", icon: "🔌", color: "#8B5CF6" }
];

export default function WasteGuide() {
  const [selectedId, setSelectedId] = useState(WASTE_DATA[0].id);
  const [activeCategory, setActiveCategory] = useState("Batteries");

  const selected = WASTE_DATA.find(item => item.id === selectedId);
  const categoryItems = WASTE_DATA.filter(item => item.category === activeCategory);

  const getToxicityColor = (level) => {
    switch (level) {
      case "High": return "#EF4444";
      case "Medium": return "#F59E0B";
      case "Low": return "#22C55E";
      default: return "#6B7280";
    }
  };

  const getToxicityBg = (level) => {
    switch (level) {
      case "High": return "rgba(239, 68, 68, 0.1)";
      case "Medium": return "rgba(245, 158, 11, 0.1)";
      case "Low": return "rgba(34, 197, 94, 0.1)";
      default: return "rgba(107, 114, 128, 0.1)";
    }
  };

  const handleCategoryChange = (catName) => {
    setActiveCategory(catName);
    const firstItem = WASTE_DATA.find(item => item.category === catName);
    if (firstItem) setSelectedId(firstItem.id);
  };

  return (
    <div className="wg">
      <header className="wg-header">
        <h1>Waste Guide</h1>
        <p>Learn how to safely recycle e-waste</p>
      </header>

      <div className="wg-categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat.name}
            className={`wg-cat-btn ${activeCategory === cat.name ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.name)}
            style={activeCategory === cat.name ? { borderColor: cat.color, boxShadow: `0 0 20px ${cat.color}30` } : {}}
          >
            <span className="wg-cat-icon">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="wg-split">
        <aside className="wg-sidebar">
          <div className="wg-sidebar-list">
            {categoryItems.map(item => (
              <button
                key={item.id}
                className={`wg-item-btn ${selectedId === item.id ? 'active' : ''}`}
                onClick={() => setSelectedId(item.id)}
              >
                <span className="wg-item-icon">{item.icon}</span>
                <span className="wg-item-name">{item.name}</span>
                <span
                  className="wg-item-dot"
                  style={{ backgroundColor: getToxicityColor(item.toxicity) }}
                />
              </button>
            ))}
          </div>
        </aside>

        <main className="wg-detail">
          {selected && (
            <div className="wg-detail-inner" key={selected.id}>
              <div className="wg-detail-top">
                <span className="wg-detail-emoji">{selected.icon}</span>
                <div>
                  <h2>{selected.name}</h2>
                  <div className="wg-detail-meta">
                    <span
                      className="wg-tox-badge"
                      style={{
                        color: getToxicityColor(selected.toxicity),
                        backgroundColor: getToxicityBg(selected.toxicity),
                        borderColor: `${getToxicityColor(selected.toxicity)}50`
                      }}
                    >
                      ● {selected.toxicity} Toxicity
                    </span>
                    <span className="wg-detail-cat">{selected.category}</span>
                  </div>
                </div>
              </div>

              <div className="wg-detail-sections">
                <div className="wg-section">
                  <div className="wg-section-head">
                    <span className="wg-section-icon">⚠️</span>
                    <h4>Why It's Harmful</h4>
                  </div>
                  <p>{selected.explanation}</p>
                </div>

                <div className="wg-section wg-section--green">
                  <div className="wg-section-head">
                    <span className="wg-section-icon">♻️</span>
                    <h4>How to Dispose Properly</h4>
                  </div>
                  <p>{selected.disposal}</p>
                </div>

                <div className="wg-section">
                  <div className="wg-section-head">
                    <span className="wg-section-icon">🌱</span>
                    <h4>Why Recycling Matters</h4>
                  </div>
                  <p>{selected.impact}</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
