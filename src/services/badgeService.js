export const BADGE_CATEGORIES = {
  WEIGHT: "Weight Milestones",
  STREAK: "Daily Streaks",
  COMMUNITY: "Community Badges",
};

export const BADGES = [
  // Weight Milestones
  {
    id: "weight_1",
    category: BADGE_CATEGORIES.WEIGHT,
    name: "Eco Starter",
    target: 1,
    icon: "🌱",
    description: "Recycled your first 1kg of e-waste."
  },
  {
    id: "weight_5",
    category: BADGE_CATEGORIES.WEIGHT,
    name: "Green Contributor",
    target: 5,
    icon: "🌿",
    description: "Reached 5kg of recycled material."
  },
  {
    id: "weight_10",
    category: BADGE_CATEGORIES.WEIGHT,
    name: "Recycling Champion",
    target: 10,
    icon: "🏆",
    description: "A true leader in the recycling movement (10kg)."
  },
  {
    id: "weight_25",
    category: BADGE_CATEGORIES.WEIGHT,
    name: "Eco Warrior",
    target: 25,
    icon: "⚔️",
    description: "Fought the good fight with 25kg recycled."
  },
  {
    id: "weight_50",
    category: BADGE_CATEGORIES.WEIGHT,
    name: "Planet Protector",
    target: 50,
    icon: "🌍",
    description: "Ultimate guardian of the planet (50kg)."
  },

  // Streak Badges
  {
    id: "streak_50",
    category: BADGE_CATEGORIES.STREAK,
    name: "Consistency King",
    target: 50,
    icon: "🔥",
    description: "Maintained a 50-day recycling streak."
  },
  {
    id: "streak_100",
    category: BADGE_CATEGORIES.STREAK,
    name: "Century Logger",
    target: 100,
    icon: "💯",
    description: "Incredible! 100 consecutive days of action."
  },
  {
    id: "streak_200",
    category: BADGE_CATEGORIES.STREAK,
    name: "Unstoppable Force",
    target: 200,
    icon: "⚡",
    description: "A legendary 200-day recycling streak."
  },

  // Community Badges
  {
    id: "community_top_10",
    category: BADGE_CATEGORIES.COMMUNITY,
    name: "Top Contributor",
    target: 10, // Top 10%
    icon: "🌟",
    description: "Ranked in the top 10% of your community.",
    isPercentile: true
  },
  {
    id: "community_leader",
    category: BADGE_CATEGORIES.COMMUNITY,
    name: "Cluster Leader",
    target: 1, // #1 in cluster
    icon: "👑",
    description: "The top recycler in your local cluster.",
    isRank: true
  }
];

/**
 * Calculates unlocked badges based on user stats.
 * @param {Object} stats - { totalWeight, streak, percentile, rankInCluster }
 * @returns {Array} List of unlocked badge objects.
 */
export const getUnlockedBadges = (stats) => {
  const { totalWeight = 0, streak = 0, percentile = 100, rankInCluster = 999 } = stats;

  return BADGES.filter(badge => {
    if (badge.category === BADGE_CATEGORIES.WEIGHT) {
      return totalWeight >= badge.target;
    }
    if (badge.category === BADGE_CATEGORIES.STREAK) {
      return streak >= badge.target;
    }
    if (badge.id === "community_top_10") {
      return percentile <= 10;
    }
    if (badge.id === "community_leader") {
      return rankInCluster === 1;
    }
    return false;
  });
};
