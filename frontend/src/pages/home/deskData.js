// Pure helpers for the desk. Everything here derives from data the app already
// has — groups, chats, sessions, task stats — nothing is invented to fill space.

const ZONE = 'Asia/Kolkata';
const isoDay = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

/** Today in IST as YYYY-MM-DD — the same day boundary the streak uses. */
export function todayIst() {
  return isoDay.format(new Date());
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function ordinalYear(n) {
  if (!n) return null;
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  return `${n}${suffix} year`;
}

export function titleCase(s) {
  return s ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ') : '';
}

/**
 * Everyone you share a live group with, once each, newest group first. A person
 * in two of your groups shows once, with every interest you share.
 */
export function peopleFromConnections(connections) {
  const byId = new Map();
  connections.forEach((group) => {
    (group.members || []).forEach((m) => {
      if (m.self) return;
      const existing = byId.get(m.userId);
      if (existing) {
        if (!existing.interests.includes(group.interestName)) existing.interests.push(group.interestName);
        return;
      }
      byId.set(m.userId, {
        ...m,
        interests: [group.interestName],
        connectionType: group.connectionType,
        chatRoomId: group.chatRoomId,
        groupId: group.id,
      });
    });
  });
  return [...byId.values()];
}

/**
 * The "continue where you left off" list: only things that are waiting on you,
 * most urgent first. Each item is { key, kind, title, detail, action, to }.
 */
export function continueItems({ chats, connections, waiting, featuredSession, submittedToday, streak }) {
  const items = [];

  chats
    .filter((c) => c.unreadCount > 0)
    .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))
    .slice(0, 2)
    .forEach((c) => items.push({
      key: `chat-${c.chatRoomId}`,
      kind: 'chat',
      title: c.title || c.interestName || 'Your chat',
      detail: `${c.unreadCount} unread message${c.unreadCount === 1 ? '' : 's'}`,
      action: 'Open chat',
      to: `/chat/${c.chatRoomId}`,
    }));

  const taskGroup = connections.find((g) => g.chatRoomId);
  if (taskGroup && !submittedToday) {
    items.push({
      key: 'task',
      kind: 'task',
      title: "Today's task",
      detail: streak > 0 ? `Submit to keep your ${streak}-day streak` : `${taskGroup.interestName} · submit to start a streak`,
      action: 'Open task',
      to: `/chat/${taskGroup.chatRoomId}`,
    });
  }

  if (featuredSession && !featuredSession.watched) {
    items.push({
      key: `session-${featuredSession.id}`,
      kind: 'session',
      title: featuredSession.started ? 'Finish this week’s session' : 'This week’s session',
      detail: `${featuredSession.title} · +${featuredSession.points} pts`,
      action: featuredSession.started ? 'Resume' : 'Watch',
      to: `/sessions/${featuredSession.id}`,
    });
  }

  waiting.slice(0, 1).forEach((g) => items.push({
    key: `wait-${g.id}`,
    kind: 'waiting',
    title: 'Still finding your group',
    detail: `${g.interestName} · ${g.memberCount}/${g.maxMembers} joined`,
    action: 'View',
    to: '/matches',
  }));

  return items.slice(0, 4);
}
