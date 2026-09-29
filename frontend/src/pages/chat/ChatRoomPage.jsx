import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessagesSquare, MoreHorizontal, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Dropdown from '../../components/ui/Dropdown';
import Modal from '../../components/ui/Modal';
import { useChatStore } from '../../store/useChatStore';
import { usePinStore } from '../../store/usePinStore';
import { useTaskStore } from '../../store/useTaskStore';
import { webSocketService } from '../../services/websocket';
import { getSmartReplies } from '../../lib/smartReplies';
import { useReducedMotion } from '../../lib/motion';
import { cn } from '../../lib/utils';
import TodaysTaskCard from './TodaysTaskCard';
import ThreadAvatar from './ThreadAvatar';
import ChatSidebar from './ChatSidebar';
import ChatDrawer from './ChatDrawer';
import MessageList from './MessageList';
import Composer from './Composer';
import Workspace from './Workspace';
import { relativeAgo } from './chatFormat';

const STARTERS = [
  'Hey! Want to work on this together?',
  'What are you currently building?',
  'When are you free to discuss this?',
];

const iconBtn = 'grid h-9 w-9 shrink-0 place-items-center rounded-md text-mute transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500';

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const {
    currentRoom, rooms, messages, systemEvents,
    fetchRoom, fetchMessages, sendMessage, markRead, loading,
  } = useChatStore();
  const { pins, togglePin } = usePinStore();
  const todaysTask = useTaskStore((st) => st.todaysTask);

  const [sending, setSending] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  // Below desktop the workspace can't sit beside the thread, so it's a second
  // pane behind a Chat | Workspace switch — one tap, always in view.
  const [pane, setPane] = useState('chat');
  const [taskOpen, setTaskOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState('');
  const composerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const initialRenderRef = useRef(true);

  const room = (rooms && rooms[roomId]) || currentRoom;
  const roomMessages = useMemo(() => messages[roomId] || [], [messages, roomId]);
  const joins = systemEvents?.[roomId] || [];

  useEffect(() => {
    setSearchOpen(false);
    setTerm('');
    setListOpen(false);
    setPane('chat');
    initialRenderRef.current = true;

    const init = async () => {
      try {
        await fetchRoom(roomId);
        await fetchMessages(roomId, 0);
        await markRead(roomId);

        webSocketService.connect();
        webSocketService.subscribe(roomId);
      } catch {
        toast.error('Could not open that conversation');
        navigate('/chat');
      }
    };
    init();

    return () => {
      webSocketService.unsubscribe(roomId);
    };
  }, [roomId]);

  // Mark read when someone else's message lands while we are looking.
  useEffect(() => {
    const unread = roomMessages.filter((m) => !m.mine && m.receiptStatus !== 'READ').length;
    if (unread > 0) markRead(roomId).catch(() => {});
  }, [roomMessages.length]);

  useEffect(() => {
    if (term) return;
    // Jump on first paint, glide afterwards.
    messagesEndRef.current?.scrollIntoView({
      behavior: initialRenderRef.current || reduced ? 'auto' : 'smooth',
      block: 'end',
    });
    if (roomMessages.length > 0) initialRenderRef.current = false;
  }, [roomMessages.length, joins.length, term]);

  // One send path for typed messages, tapped replies and attachments alike, so
  // all of them get the same guard, error toast and rate-limit behaviour.
  const sendText = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return false;
    try {
      setSending(true);
      // REST send. The socket echo is deduped by the store.
      await sendMessage(roomId, trimmed);
      return true;
    } catch (error) {
      toast.error(error.message || 'That did not send');
      return false;
    } finally {
      setSending(false);
    }
  };

  if (loading && !room) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-line bg-surface text-accent-500">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-line bg-surface">
        <p className="text-sm text-mute">That conversation isn&rsquo;t here.</p>
      </div>
    );
  }

  const roomTitle = room.title || room.interestName || 'Chat';
  const memberCount = room.members?.length || 0;
  const other = room.type === 'ONE_ON_ONE' ? room.members?.find((m) => !m.self) : null;
  const pinned = pins.has(roomId);

  // "Last message" rather than a fake online dot: it's the one presence signal
  // the app actually has.
  const lastFromThem = [...roomMessages].reverse().find((m) => !m.mine);

  const q = term.trim().toLowerCase();
  const shown = q ? roomMessages.filter((m) => (m.content || '').toLowerCase().includes(q)) : roomMessages;

  const suggestions = roomMessages.length > 0
    ? getSmartReplies({ lastMessage: roomMessages[roomMessages.length - 1] || null, room })
    : [];

  const moreItems = [
    { label: pinned ? 'Unpin conversation' : 'Pin conversation', onClick: () => togglePin(roomId) },
    other && { label: 'View profile', onClick: () => navigate(`/profile/${other.userId}`) },
    room.matchGroupId && { label: 'Group details', onClick: () => navigate(`/matches/${room.matchGroupId}`) },
  ].filter(Boolean);

  const workspace = (
    <Workspace
      room={room}
      onOpenTask={() => setTaskOpen(true)}
      onShareFile={() => { setPane('chat'); requestAnimationFrame(() => composerRef.current?.attach()); }}
    />
  );

  // A dot on the Workspace switch when today's task still wants something from you.
  const task = todaysTask?.assignment ? todaysTask : null;
  const mySub = task?.submissions?.find((x) => x.mine);
  const pendingReview = task?.submissions?.some((x) => !x.mine && !x.reviewedByMe);
  const taskNudge = task && (!mySub || pendingReview)
    ? (!mySub ? 'Task to do' : 'Review waiting')
    : null;

  return (
    <div className="flex min-h-0 flex-1 gap-3 md:gap-5">
      {/* ------------------------------------------------ the conversation */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-surface">
        <header className="flex shrink-0 items-center gap-2 border-b border-line px-2.5 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
          <button onClick={() => setListOpen(true)} aria-label="Open messages" className={cn(iconBtn, 'lg:hidden')}>
            <MessagesSquare className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <ThreadAvatar type={room.type} members={room.members} size="md" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-base font-bold leading-tight tracking-tight text-ink">{roomTitle}</h1>
            <p className="truncate text-xs text-mute">
              {room.interestName}
              <span className="hidden sm:inline">
                {' '}&middot; {memberCount} {memberCount === 1 ? 'person' : 'people'}
                {lastFromThem?.sentAt && <> &middot; last message {relativeAgo(lastFromThem.sentAt)}</>}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => { setSearchOpen((o) => !o); setTerm(''); }}
              aria-label="Search this conversation"
              aria-pressed={searchOpen}
              className={cn(iconBtn, searchOpen && 'bg-surface-2 text-ink')}
            >
              <Search className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
            <Dropdown
              align="right"
              label="More options"
              trigger={<span className={iconBtn}><MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" /></span>}
              items={moreItems}
            />
          </div>
        </header>

        <div role="tablist" aria-label="Conversation view" className="flex shrink-0 gap-1 border-b border-line px-3 py-1.5 xl:hidden">
          {[
            { key: 'chat', label: 'Chat' },
            { key: 'workspace', label: 'Workspace', note: taskNudge },
          ].map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={pane === t.key}
              onClick={() => setPane(t.key)}
              className={cn(
                'relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                pane === t.key ? 'bg-accent-50 text-accent-700' : 'text-mute hover:text-ink'
              )}
            >
              {t.label}
              {t.note && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-wait">
                  <span className="h-1.5 w-1.5 rounded-full bg-wait" aria-hidden="true" />
                  <span className="hidden min-[380px]:inline">{t.note}</span>
                  <span className="sr-only min-[380px]:hidden">{t.note}</span>
                </span>
              )}
            </button>
          ))}
        </div>

        {pane === 'workspace' && (
          <div className="min-h-0 flex-1 overflow-y-auto xl:hidden">{workspace}</div>
        )}

        <div className={cn('min-h-0 flex-1 flex-col', pane === 'workspace' ? 'hidden xl:flex' : 'flex')}>
        {searchOpen && (
          <div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface-2/40 px-3 py-2 sm:px-4">
            <Search className="h-4 w-4 shrink-0 text-mute" aria-hidden="true" />
            <label htmlFor="thread-search" className="sr-only">Search messages</label>
            <input
              id="thread-search"
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); setTerm(''); } }}
              placeholder="Search messages"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-mute/70 focus:outline-none"
            />
            {q && <span className="shrink-0 text-xs text-mute tnum">{shown.length} {shown.length === 1 ? 'match' : 'matches'}</span>}
            <button onClick={() => { setSearchOpen(false); setTerm(''); }} aria-label="Close search" className="grid h-7 w-7 place-items-center rounded-md text-mute hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <div role="log" aria-label="Messages" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 sm:px-6 sm:pb-4">
          {roomMessages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-sm flex-col items-center justify-center py-10 text-center">
              <ThreadAvatar type={room.type} members={room.members} size="lg" />
              <h2 className="mt-4 font-display text-lg font-bold tracking-tight text-ink">Start the conversation</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-mute">
                Say hello and discuss what you&rsquo;d like to work on together.
              </p>
              <ul className="mt-5 flex w-full flex-col gap-2">
                {STARTERS.map((s) => (
                  <li key={s}>
                    <button
                      onClick={() => composerRef.current?.insert(s)}
                      className="w-full rounded-lg border border-line px-3.5 py-2.5 text-left text-sm text-ink transition-colors hover:border-accent-400 hover:bg-accent-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : q && shown.length === 0 ? (
            <p className="py-16 text-center text-sm text-mute">No messages match &ldquo;{term.trim()}&rdquo;.</p>
          ) : (
            <MessageList messages={shown} joins={q ? [] : joins} term={q} />
          )}
          <div ref={messagesEndRef} />
        </div>

        <Composer ref={composerRef} onSend={sendText} sending={sending} suggestions={suggestions} />
        </div>
      </div>

      {/* ------------------------------------------ workspace (desktop) */}
      <aside
        aria-label="Workspace"
        className="hidden min-h-0 w-[30%] min-w-[280px] max-w-[400px] shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-surface xl:flex"
      >
        <h2 className="shrink-0 border-b border-line px-4 pb-3 pt-4 font-display text-xl font-bold tracking-tight text-ink">Workspace</h2>
        <div className="min-h-0 flex-1 overflow-y-auto">{workspace}</div>
      </aside>

      {/* ------------------------------------ drawers below desktop width */}
      <ChatDrawer open={listOpen} onClose={() => setListOpen(false)} side="left" title="Messages">
        <ChatSidebar inDrawer onNavigate={() => setListOpen(false)} />
      </ChatDrawer>

      {room.matchGroupId && (
        <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="Today's task" size="lg">
          <TodaysTaskCard groupId={room.matchGroupId} bare autoRefresh={false} />
        </Modal>
      )}
    </div>
  );
}
