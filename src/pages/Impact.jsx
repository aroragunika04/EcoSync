import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserLogs, getClusterLogs } from "../services/wasteService";
import { BADGES, BADGE_CATEGORIES, getUnlockedBadges } from "../services/badgeService";
import BadgePopup from "../components/BadgePopup";

export default function Impact() {
  const { currentUser, userData } = useAuth();
  const [logs, setLogs] = useState([]);
  const [clusterLogs, setClusterLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBadgesQueue, setNewBadgesQueue] = useState([]);

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      try {
        setLoading(true);
        const userLogsData = await getUserLogs(currentUser.uid);
        setLogs(userLogsData.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis()));

        if (userData?.clusterId) {
          const clusterLogsData = await getClusterLogs(userData.clusterId);
          setClusterLogs(clusterLogsData);
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentUser, userData]);

  // Derived calculations
  const totalWeight = logs.reduce((sum, log) => sum + (log.totalWeight || 0), 0); // Already in kg
  const co2Saved = (totalWeight * 1.2).toFixed(2);
  const materialsRecovered = (totalWeight * 0.4).toFixed(2);
  const plasticBottles = Math.floor(totalWeight * 20);

  // Streak Tracker Logic
  const calculateStreak = () => {
    if (!logs.length) return 0;
    
    // Extract unique dates formatted as YYYY-MM-DD
    const dates = [...new Set(logs.map(log => {
      const d = log.timestamp?.toDate() || new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }))].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const firstLogDate = new Date(dates[0]);
    firstLogDate.setHours(0, 0, 0, 0);

    // If the latest log is not from today or yesterday, streak is broken
    const diffTime = Math.abs(currentDate - firstLogDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) return 0;

    // Check consecutive days
    let checkDate = new Date(firstLogDate);
    for (let i = 0; i < dates.length; i++) {
      const logDate = new Date(dates[i]);
      logDate.setHours(0, 0, 0, 0);
      
      if (logDate.getTime() === checkDate.getTime()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };
  const streak = calculateStreak();

  // Monthly Summary Logic
  const getMonthlyStats = () => {
    const now = new Date();
    const currentMonthLogs = logs.filter(log => {
      const logDate = log.timestamp?.toDate() || new Date();
      return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
    });

    const monthlyWeight = currentMonthLogs.reduce((sum, log) => sum + (log.totalWeight || 0), 0);
    const uniqueDays = new Set(currentMonthLogs.map(log => {
      const d = log.timestamp?.toDate() || new Date();
      return d.getDate();
    })).size;

    return {
      items: currentMonthLogs.length,
      weight: monthlyWeight.toFixed(2),
      activeDays: uniqueDays
    };
  };
  const monthlyStats = getMonthlyStats();

  // Community Comparison Logic
  const getCommunityStats = () => {
    if (!clusterLogs.length) return { text: "Top 100%", percentile: 100, rankInCluster: 1 };
    
    const userTotals = {};
    clusterLogs.forEach(log => {
      userTotals[log.userId] = (userTotals[log.userId] || 0) + (log.totalWeight || 0);
    });

    const sortedTotals = Object.values(userTotals).sort((a, b) => b - a);
    const myTotal = totalWeight;
    
    const rankIndex = sortedTotals.findIndex(total => total <= myTotal);
    const rankInCluster = rankIndex + 1;
    let rawPercentile = Math.ceil((rankInCluster / sortedTotals.length) * 100);
    const percentile = Math.max(rawPercentile, 10);
    
    let text = "Top 50%+";
    if (percentile <= 10) text = "Top 10%";
    else if (percentile <= 20) text = "Top 20%";
    else if (percentile <= 30) text = "Top 30%";
    else if (percentile <= 50) text = "Top 50%";

    return { text, percentile: rawPercentile, rankInCluster };
  };
  const communityStats = getCommunityStats();
  const percentileText = communityStats.text;

  // Next Milestone Logic
  const weightBadges = BADGES.filter(b => b.category === BADGE_CATEGORIES.WEIGHT);
  const nextMilestone = weightBadges.find(b => totalWeight < b.target) || weightBadges[weightBadges.length - 1];
  const progressPercentage = Math.min((totalWeight / nextMilestone.target) * 100, 100);

  const unlockedBadges = getUnlockedBadges({
    totalWeight,
    streak,
    percentile: communityStats.percentile,
    rankInCluster: communityStats.rankInCluster
  });

  useEffect(() => {
    if (loading || !currentUser) return;
    
    const currentUnlockedIds = unlockedBadges.map(b => b.id);
    const storedIds = JSON.parse(localStorage.getItem(`ecosync_badges_${currentUser.uid}`) || "[]");
    
    const newUnlocks = unlockedBadges.filter(b => !storedIds.includes(b.id));
    
    if (newUnlocks.length > 0) {
      setNewBadgesQueue(newUnlocks);
      localStorage.setItem(`ecosync_badges_${currentUser.uid}`, JSON.stringify(currentUnlockedIds));
    }
  }, [loading, totalWeight, streak, unlockedBadges, currentUser]);

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <p>Loading your impact data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--clr-text)' }}>Your Impact</h1>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '1.1rem' }}>See how your recycling efforts are making a difference.</p>
        </div>
        <div style={{ background: 'var(--clr-surface)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🔥</span>
          <span style={{ fontWeight: 'bold' }}>{streak}-day streak</span>
        </div>
      </header>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="stat-card" style={{ background: 'var(--clr-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>Total Recycled</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--clr-primary)', marginBottom: '0.5rem' }}>{totalWeight.toFixed(2)} kg</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>You are in the <strong>{percentileText}</strong> of your community!</p>
        </div>
        
        <div className="stat-card" style={{ background: 'var(--clr-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>CO₂ Saved</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80', marginBottom: '0.5rem' }}>{co2Saved} kg</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Equivalent to planting ~{Math.floor(co2Saved / 20) || 1} trees 🌳</p>
        </div>
        
        <div className="stat-card" style={{ background: 'var(--clr-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>Real-World Impact</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#60a5fa', marginBottom: '0.5rem' }}>{plasticBottles}</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Plastic bottles worth of materials recovered ♻️</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: History & Monthly Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Progress & Next Milestone */}
          <section style={{ background: 'var(--clr-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Next Milestone</h2>
              <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>Target: {nextMilestone.target}kg</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>{nextMilestone.icon}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{nextMilestone.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>You've recycled {totalWeight.toFixed(2)}kg. Just {(nextMilestone.target - totalWeight).toFixed(2)}kg to go!</p>
              </div>
            </div>

            <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercentage}%`, height: '100%', background: 'var(--clr-primary)', transition: 'width 1s ease-out' }}></div>
            </div>
          </section>

          {/* History Table */}
          <section style={{ background: 'var(--clr-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Contribution History</h2>
            
            {logs.length === 0 ? (
              <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', padding: '2rem 0' }}>No logs yet. Start logging waste to see your history!</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '0.75rem 0', color: 'var(--clr-text-muted)', fontWeight: 'normal', fontSize: '0.9rem' }}>Date</th>
                      <th style={{ padding: '0.75rem 0', color: 'var(--clr-text-muted)', fontWeight: 'normal', fontSize: '0.9rem' }}>Item</th>
                      <th style={{ padding: '0.75rem 0', color: 'var(--clr-text-muted)', fontWeight: 'normal', fontSize: '0.9rem' }}>Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      const dateObj = log.timestamp?.toDate() || new Date();
                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '1rem 0', fontSize: '0.95rem' }}>{dateObj.toLocaleDateString()}</td>
                          <td style={{ padding: '1rem 0', fontSize: '0.95rem', textTransform: 'capitalize' }}>{log.itemType} {log.quantity > 1 ? `(x${log.quantity})` : ''}</td>
                          <td style={{ padding: '1rem 0', fontSize: '0.95rem', color: 'var(--clr-primary)' }}>{((log.totalWeight || 0)).toFixed(2)} kg</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Badges & Monthly Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Badges Section */}
          <section style={{ background: 'var(--clr-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', maxHeight: '520px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Badges & Achievements</h2>
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {Object.values(BADGE_CATEGORIES).map(category => {
                const categoryBadges = BADGES.filter(b => b.category === category);
                if (categoryBadges.length === 0) return null;
                
                return (
                  <div key={category}>
                    <h3 style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.1em', fontWeight: 800 }}>{category}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                      {categoryBadges.map(badge => {
                        const isUnlocked = unlockedBadges.some(ub => ub.id === badge.id);
                        return (
                          <div key={badge.id} className={isUnlocked ? "glow-hover" : ""} style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            textAlign: 'center',
                            gap: '0.75rem', 
                            padding: '1rem', 
                            background: isUnlocked ? 'rgba(34, 197, 94, 0.03)' : 'rgba(255,255,255,0.01)',
                            border: isUnlocked ? '1px solid var(--clr-primary)' : '1px dashed rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            opacity: isUnlocked ? 1 : 0.4,
                            transition: 'all 0.3s ease',
                            position: 'relative'
                          }}>
                            {isUnlocked && (
                              <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--clr-primary)', color: '#000', fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 900, boxShadow: '0 0 10px var(--clr-primary-glow)' }}>
                                UNLOCKED
                              </div>
                            )}
                            <div style={{ fontSize: '2.5rem', filter: isUnlocked ? 'drop-shadow(0 0 10px var(--clr-primary-glow))' : 'grayscale(1)' }}>{badge.icon}</div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.85rem', color: isUnlocked ? '#fff' : 'var(--clr-text-muted)', fontWeight: 800 }}>
                                {badge.name} 
                              </h4>
                              <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: 'var(--clr-text-muted)', lineHeight: 1.3 }}>{badge.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Monthly Summary */}
          <section style={{ background: 'var(--clr-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>This Month</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>Items Logged</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{monthlyStats.items}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>Total Weight</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--clr-primary)' }}>{monthlyStats.weight} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>Active Days</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{monthlyStats.activeDays}</span>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* LeetCode-style Popup Queue */}
      {newBadgesQueue.length > 0 && (
        <BadgePopup 
          badge={newBadgesQueue[0]} 
          onClose={() => setNewBadgesQueue(prev => prev.slice(1))} 
        />
      )}
    </div>
  );
}
