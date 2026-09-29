// Formatting and grouping for the chat surface. Pure functions only.

export const TYPE_LABEL = { ONE_ON_ONE: '1:1', GROUP: 'Group', SOCIETY: 'Society' };

const GROUP_WINDOW_MS = 5 * 60 * 1000;

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function dayLabel(date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
    ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  });
}

export function timeLabel(ts) {
  return ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
}

/** Thread-list stamp: time today, "Yesterday", else a short date. */
export function listStamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const label = dayLabel(d);
  return label === 'Today' ? timeLabel(ts) : label === 'Yesterday' ? 'Yesterday' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function relativeAgo(ts) {
  if (!ts) return '';
  const secs = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  const days = Math.floor(secs / 86400);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

/**
 * Chronological messages → [{ day, groups: [{ senderId, mine, senderName, senderPhotoUrl, messages }] }].
 * A run breaks when the sender changes, the day changes, or five quiet minutes pass.
 */
export function groupMessages(messages) {
  const days = [];
  messages.forEach((m) => {
    const at = m.sentAt ? new Date(m.sentAt) : new Date();
    let day = days[days.length - 1];
    if (!day || !sameDay(day.date, at)) {
      day = { date: at, label: dayLabel(at), groups: [] };
      days.push(day);
    }
    const group = day.groups[day.groups.length - 1];
    const last = group?.messages[group.messages.length - 1];
    const lastAt = last?.sentAt ? new Date(last.sentAt) : null;
    if (group && group.senderId === m.senderId && lastAt && at - lastAt < GROUP_WINDOW_MS) {
      group.messages.push(m);
    } else {
      day.groups.push({
        senderId: m.senderId, mine: m.mine, senderName: m.senderName, senderPhotoUrl: m.senderPhotoUrl, messages: [m],
      });
    }
  });
  return days;
}

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;

/** Splits text into [{ text } | { url }] so links render as links, never as raw HTML. */
export function linkParts(text) {
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(URL_RE)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ url: match[0] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

export function isImageUrl(url) {
  return /\.(jpe?g|png|webp|gif)($|[?#])/i.test(url) || /\/image\/upload\//.test(url);
}

export function isPdfUrl(url) {
  return /\.pdf($|[?#])/i.test(url);
}

/** A message that is nothing but one uploaded file — rendered as the file, not as a link. */
export function soleAttachment(content) {
  const t = (content || '').trim();
  if (!/^https?:\/\/\S+$/.test(t)) return null;
  if (isImageUrl(t)) return { kind: 'image', url: t };
  if (isPdfUrl(t)) return { kind: 'pdf', url: t };
  return null;
}

// Pins are a per-device convenience, so they live in this browser only.
const PIN_KEY = 'collzap:pinned-chats';

export function readPins() {
  try {
    return new Set(JSON.parse(localStorage.getItem(PIN_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export function writePins(pins) {
  try {
    localStorage.setItem(PIN_KEY, JSON.stringify([...pins]));
  } catch {
    // Storage blocked — pins just won't persist.
  }
}

/** What a connection shape means for the people in it, in plain words. */
export function connectionGoal(type) {
  switch (type) {
    case 'ONE_ON_ONE': return 'A one-on-one partner to build and learn with';
    case 'GROUP': return 'A small group of up to 4, working through it together';
    case 'SOCIETY': return 'An open community for everyone on this interest';
    default: return 'Build and learn together';
  }
}
