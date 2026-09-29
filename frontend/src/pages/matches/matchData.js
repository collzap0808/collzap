// Pure helpers for Matches. Everything derives from the circle the matcher
// already built — no scores or reasons are invented.

export const SHAPE = {
  ONE_ON_ONE: { short: '1-on-1', long: '1-on-1 partner' },
  SHORT_GROUP: { short: 'Small group', long: 'Small group (up to 4)' },
  SOCIETY: { short: 'Community', long: 'Open community' },
};

export const LEVEL = {
  BEGINNER: 'Beginner',
  LEARNING: 'Learning',
  INTERMEDIATE: 'Intermediate',
  EXPERT: 'Expert',
};

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function ordinalYear(n) {
  if (!n) return null;
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  return `${n}${suffix} year`;
}

export function formatWaiting(seconds) {
  if (seconds == null) return null;
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))} min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`;
  const d = Math.floor(seconds / 86400);
  return `${d} day${d === 1 ? '' : 's'}`;
}

/** Plain-language capacity, only where it tells you something. */
export function spotsLabel(group) {
  if (group.connectionType === 'SOCIETY') return `${group.memberCount} member${group.memberCount === 1 ? '' : 's'}`;
  if (group.connectionType === 'ONE_ON_ONE') return group.memberCount >= 2 ? 'Pair complete' : 'Waiting for a partner';
  const left = group.maxMembers - group.memberCount;
  return left > 0 ? `${left} spot${left === 1 ? '' : 's'} left` : 'Group full';
}

/**
 * Everyone you share a live group with, once each. A person in two of your
 * groups keeps both — that's what "shared interests" counts.
 */
export function peopleFromCircle(connections) {
  const byId = new Map();
  connections.forEach((g) => {
    const me = (g.members || []).find((m) => m.self);
    (g.members || []).forEach((m) => {
      if (m.self) return;
      const entry = byId.get(m.userId) || {
        userId: m.userId,
        name: m.name,
        profilePhotoUrl: m.profilePhotoUrl,
        yearOfStudy: m.yearOfStudy,
        level: m.level,
        joinedAt: m.joinedAt,
        groups: [],
      };
      entry.groups.push({
        id: g.id, interestName: g.interestName, connectionType: g.connectionType, chatRoomId: g.chatRoomId,
        levelBand: g.levelBand, myLevel: me?.level, theirLevel: m.level,
      });
      // The most recent time you two ended up in a group together.
      if (m.joinedAt && (!entry.joinedAt || new Date(m.joinedAt) > new Date(entry.joinedAt))) entry.joinedAt = m.joinedAt;
      byId.set(m.userId, entry);
    });
  });
  return [...byId.values()]
    .map((p) => ({ ...p, isNew: !!p.joinedAt && Date.now() - new Date(p.joinedAt) < NEW_WINDOW_MS }))
    .sort((a, b) => new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0));
}

/** The real reasons the matcher put you together, most specific first. */
export function matchReasons(person) {
  const reasons = [];
  const n = person.groups.length;
  reasons.push(n === 1 ? `Both into ${person.groups[0].interestName}` : `${n} shared interests`);
  const sameLevel = person.groups.some((g) => g.myLevel && g.myLevel === g.theirLevel);
  reasons.push(sameLevel ? 'Same skill level' : 'Similar skill level');
  reasons.push('Same campus');
  const shape = SHAPE[person.groups[0].connectionType];
  if (shape) reasons.push(shape.long);
  return reasons;
}
