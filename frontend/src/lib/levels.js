export const MAX_POINTS = 10000;

// The six levels. `floor` is the first point value that counts as that level;
// the percentage is simply points / 100, which is what the spec's % ranges are.
// Seed is live: admin-reviewed solo tasks, and peer matching opens inside Seed at
// the server's collzap.matching.unlock-points (500 by default). The higher levels
// are shown as coming soon rather than promising features that aren't built yet.
export const LEVELS = [
  { name: 'Seed', floor: 0, tagline: 'Just getting started', unlock: 'Daily tasks, then peer matching at 500 pts', live: true },
  { name: 'Sprout', floor: 2001, tagline: 'Building the habit', unlock: 'Mentorship session access', feature: 'Mentorship access' },
  { name: 'Growing', floor: 4001, tagline: 'Actively developing skills', unlock: 'Certification eligibility', feature: 'Certification' },
  { name: 'Thriving', floor: 6001, tagline: 'Consistently delivering', unlock: 'College leaderboard', feature: 'College leaderboard' },
  { name: 'Peak', floor: 8001, tagline: 'Among the most committed', unlock: 'Placement pool entry', feature: 'Placement pool' },
  { name: 'Realized', floor: 9501, tagline: 'Potential realized', unlock: 'Realized Potential badge', feature: 'Realized Potential badge' },
];

export function levelIndexFor(points) {
  let idx = 0;
  LEVELS.forEach((l, i) => { if (points >= l.floor) idx = i; });
  return idx;
}

export function potentialPct(points) {
  return Math.min(100, Math.round(points / 100));
}
