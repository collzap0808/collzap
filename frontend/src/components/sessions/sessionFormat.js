// Sessions are scheduled for an Indian audience, so times always read in IST —
// the same zone the daily tasks roll over in.
const ZONE = 'Asia/Kolkata';

export function sessionWhen(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: ZONE, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso));
}

export function sessionDateParts(iso) {
  const d = new Date(iso);
  return {
    day: new Intl.DateTimeFormat('en-IN', { timeZone: ZONE, day: 'numeric' }).format(d),
    month: new Intl.DateTimeFormat('en-IN', { timeZone: ZONE, month: 'short' }).format(d),
    time: new Intl.DateTimeFormat('en-IN', { timeZone: ZONE, weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(d),
  };
}

export function thumbnailUrl(videoId) {
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
}

export function speakerLine(s) {
  return [s.speakerName, s.speakerRole].filter(Boolean).join(' · ');
}

export function watchedLabel(n) {
  return n === 1 ? 'Watched by 1 student' : `Watched by ${n} students`;
}
