import React, { useState, useEffect } from "react";

const FACTS = [
  { text: "Only about 20% of global e-waste is properly recycled.", highlight: "20%" },
  { text: "E-waste is the fastest-growing waste stream in the world.", highlight: "fastest-growing" },
  { text: "A single phone contains valuable metals like gold and copper.", highlight: "gold and copper" },
  { text: "Recycling 1 million laptops saves the energy used by 3,500 homes.", highlight: "1 million" },
  { text: "It takes 530 lbs of fossil fuel and 1.5 tons of water to manufacture one computer.", highlight: "530 lbs" },
  { text: "Properly recycling e-waste prevents lead and mercury from contaminating groundwater.", highlight: "lead and mercury" },
  { text: "The amount of global e-waste is expected to grow to 74.7 million metric tons by 2030.", highlight: "74.7 million" },
  { text: "Recycling circuit boards can be more valuable than mining for ore.", highlight: "more valuable" },
  { text: "E-waste accounts for 70% of our overall toxic waste.", highlight: "70%" },
  { text: "The value of raw materials in 2019 e-waste was estimated at $57 billion USD.", highlight: "$57 billion" },
  { text: "The 'Right to Repair' movement aims to reduce e-waste by allowing users to fix devices.", highlight: "Right to Repair" },
  { text: "Recycling aluminum from e-waste uses 95% less energy than raw production.", highlight: "95% less" },
  { text: "Together, we can achieve a zero e-waste future.", highlight: "zero e-waste" }
];

export default function QuickFacts() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FACTS.length);
    }, 25000);
    return () => clearInterval(timer);
  }, []);

  const nextFact = () => {
    setCurrentIndex((prev) => (prev + 1) % FACTS.length);
  };

  const currentFact = FACTS[currentIndex];

  const renderText = (text, highlight) => {
    const parts = text.split(highlight);
    return (
      <>
        {parts[0]}
        <span className="highlight">{highlight}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <div className="dash-card fact-card" style={{
      backgroundImage: `linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(13,13,13,0.7) 100%), url('/images/globe_circuit.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      border: '1px solid var(--clr-border)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="fact-content" style={{height: '100%', display: 'flex', flexDirection: 'column', padding: '0.25rem'}}>
        <div className="card-header" style={{marginBottom: '0.5rem', border: 'none'}}>
          <div className="card-title-group">
            <h3 style={{fontSize: '1rem', fontWeight: '700'}}>Did You Know?</h3>
          </div>
          <div className="card-icon-box" style={{width: '32px', height: '32px', background: 'rgba(34, 197, 94, 0.1)'}}>
            <span style={{fontSize: '1rem'}}>💡</span>
          </div>
        </div>

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100px', position: 'relative', paddingLeft: '1rem'}}>
          <span style={{
            position: 'absolute', top: '-10px', left: '-5px', 
            fontSize: '4rem', color: 'rgba(34, 197, 94, 0.4)', 
            fontFamily: 'serif', lineHeight: 1, zIndex: 1
          }}>
            &ldquo;
          </span>
          <p className="fact-text" style={{
            fontSize: '1.2rem', lineHeight: '1.5', fontWeight: '500', 
            fontStyle: 'italic', margin: '0', position: 'relative', zIndex: 2,
            textShadow: '0 2px 8px rgba(0,0,0,1)'
          }}>
            {renderText(currentFact.text, currentFact.highlight)}
          </p>
        </div>
      </div>
    </div>
  );
}
