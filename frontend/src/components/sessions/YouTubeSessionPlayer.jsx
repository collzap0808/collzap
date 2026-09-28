import { useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const UNLOCK = 0.8;
const RETRY_MS = 20000;

// One script tag for the whole app, however many players mount.
let apiPromise = null;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve(window.YT);
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        apiPromise = null;
        reject(new Error('YouTube could not be loaded'));
      };
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

const storageKey = (sessionId) => `collzap:session-watch:${sessionId}`;

function readSeconds(sessionId) {
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function writeSeconds(sessionId, seconds) {
  try {
    localStorage.setItem(storageKey(sessionId), JSON.stringify([...seconds]));
  } catch {
    // Private mode or storage full — progress just won't survive a refresh.
  }
}

function clearSeconds(sessionId) {
  try {
    localStorage.removeItem(storageKey(sessionId));
  } catch {
    // ignore
  }
}

/**
 * Embeds a session's YouTube video and measures genuine watching: while it
 * plays, each second of the video that actually plays through is marked.
 * Seeking ahead jumps more than a normal tick, so the skipped seconds are never
 * marked, and rewatching a part marks nothing new. At 80% of the video marked,
 * it asks the server for the points; the server has its own elapsed-time check
 * and may say "not yet", in which case this quietly retries.
 */
export default function YouTubeSessionPlayer({ sessionId, videoId, title, points, watched, onStart, onComplete, className }) {
  const hostRef = useRef(null);
  const onStartRef = useRef(onStart);
  const onCompleteRef = useRef(onComplete);
  // Read once: when the points land the parent flips `watched`, and that must
  // not tear down and restart the video mid-play.
  const watchedAtMount = useRef(watched);
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState(watched ? 'earned' : 'watching'); // watching | claiming | waiting | earned
  const [justEarned, setJustEarned] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    onStartRef.current = onStart;
    onCompleteRef.current = onComplete;
  }, [onStart, onComplete]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !videoId) return undefined;

    let cancelled = false;
    let player = null;
    let last = null;
    let started = false;
    let done = watchedAtMount.current;
    let claiming = false;
    let retryTimer = null;
    const seconds = done ? new Set() : readSeconds(sessionId);

    const claim = async () => {
      if (done || claiming || cancelled) return;
      claiming = true;
      setPhase('claiming');
      try {
        const result = await onCompleteRef.current?.();
        if (cancelled) return;
        done = true;
        clearSeconds(sessionId);
        setJustEarned((result?.pointsAwarded ?? 0) > 0);
        setPhase('earned');
      } catch {
        if (cancelled) return;
        // Most likely the server's "not enough real time yet" — try again shortly.
        setPhase('waiting');
        retryTimer = setTimeout(() => { claiming = false; claim(); }, RETRY_MS);
        return;
      }
      claiming = false;
    };

    const tick = () => {
      if (done || !player?.getPlayerState) return;
      if (player.getPlayerState() !== window.YT.PlayerState.PLAYING) {
        last = null;
        return;
      }
      const now = player.getCurrentTime();
      const duration = player.getDuration();
      if (last != null) {
        const step = now - last;
        // A normal 1s tick advances ~1s (up to ~2s at 2x speed). Anything else
        // is a seek, backwards or forwards, and marks nothing.
        if (step > 0 && step <= 2.5) {
          for (let s = Math.floor(last); s < Math.ceil(now); s += 1) seconds.add(s);
          writeSeconds(sessionId, seconds);
        }
      }
      last = now;
      if (duration > 0) {
        const ratio = Math.min(1, seconds.size / Math.floor(duration));
        setPct(Math.round(ratio * 100));
        if (ratio >= UNLOCK) claim();
      }
    };

    // The API replaces the node it is given with an iframe, so give it one
    // React doesn't own.
    const mount = document.createElement('div');
    mount.className = 'h-full w-full';
    host.appendChild(mount);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        player = new YT.Player(mount, {
          host: 'https://www.youtube-nocookie.com',
          videoId,
          width: '100%',
          height: '100%',
          playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
          events: {
            onReady: () => {
              const duration = player.getDuration();
              if (!done && duration > 0) setPct(Math.min(100, Math.round((seconds.size / Math.floor(duration)) * 100)));
            },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PLAYING) {
                last = player.getCurrentTime();
                if (!started && !done) {
                  started = true;
                  onStartRef.current?.();
                }
              } else {
                last = null;
              }
            },
            onError: () => setLoadError('This video can’t be played here. It may be private or removed.'),
          },
        });
      })
      .catch((err) => { if (!cancelled) setLoadError(err.message); });

    const interval = setInterval(tick, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(retryTimer);
      try { player?.destroy?.(); } catch { /* already gone */ }
      host.replaceChildren();
    };
  }, [sessionId, videoId]);

  const earned = phase === 'earned';

  return (
    <div className={cn('overflow-hidden rounded-lg border border-line bg-surface', className)}>
      <div className="relative aspect-video w-full bg-ink">
        <div ref={hostRef} className="absolute inset-0" title={title} />
        {loadError && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white/80">{loadError}</div>
        )}
      </div>

      <div className="px-4 py-3 sm:px-5" aria-live="polite">
        {earned ? (
          <p className="flex items-center gap-2 text-sm font-medium text-teal-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {justEarned ? (
              <span>+{points} points earned. Nice work.</span>
            ) : (
              <span>You&rsquo;ve watched this session &middot; {points} pts earned</span>
            )}
          </p>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink">
                Watched <span className="font-semibold tnum">{pct}%</span>
              </span>
              <span className="text-xs text-mute">
                {phase === 'claiming'
                  ? 'Adding your points…'
                  : phase === 'waiting'
                    ? 'Almost there, keep watching'
                    : `+${points} pts at ${Math.round(UNLOCK * 100)}%`}
              </span>
            </div>
            <div className="relative mt-2 h-1.5 rounded-full bg-surface-2">
              <div className="grad-brand h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
              <span
                className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-mute"
                style={{ left: `${UNLOCK * 100}%` }}
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 text-[11px] text-mute">Only time actually watched counts. Skipping ahead doesn&rsquo;t.</p>
          </>
        )}
      </div>
    </div>
  );
}
