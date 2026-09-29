// Shared, pure helpers for the own-profile and peer-profile pages.

export const LEVEL = {
  BEGINNER: { label: 'Beginner', rank: 1 },
  LEARNING: { label: 'Learning', rank: 2 },
  INTERMEDIATE: { label: 'Intermediate', rank: 3 },
  EXPERT: { label: 'Expert', rank: 4 },
};

export function ordinalYear(n) {
  if (!n) return null;
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  return `${n}${suffix} year`;
}

/**
 * Own-profile and peer-profile responses name the interest differently
 * (`interestName` on both, but older code read `name`). Normalise once.
 */
export function normaliseInterests(list) {
  return (Array.isArray(list) ? list : []).map((i) => ({
    name: i.interestName || i.name || '',
    projectType: i.projectType,
    subTag: i.subTag || null,
    level: i.level || null,
  })).filter((i) => i.name);
}

/** What counts toward "profile complete" — every item is something a peer reads. */
export function completion(profile, interests) {
  const checks = [
    { label: 'photo', done: !!profile.profilePhotoUrl },
    { label: 'course', done: !!profile.course },
    { label: 'city', done: !!profile.city },
    { label: 'year', done: !!profile.yearOfStudy },
    { label: 'intro', done: !!profile.storyPrompt1 },
    { label: 'what you’re working on', done: !!profile.storyPrompt2 },
    { label: 'a fact about you', done: !!profile.storyPrompt3 },
    { label: 'portfolio link', done: !!profile.proofOfWorkUrl },
    { label: 'interests', done: interests.length > 0 },
  ];
  const done = checks.filter((c) => c.done).length;
  return {
    pct: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c.done).map((c) => c.label),
  };
}
