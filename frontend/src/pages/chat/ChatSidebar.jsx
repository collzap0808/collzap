import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageSquare, Pin, Search } from 'lucide-react';
import ThreadAvatar from './ThreadAvatar';
import { cn } from '../../lib/utils';
import { useChatStore } from '../../store/useChatStore';
import { usePinStore } from '../../store/usePinStore';
import { TYPE_LABEL, listStamp } from './chatFormat';

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'SHORT_TERM', label: 'Short-term' },
];

/**
 * The persistent thread list — ChatShell's left column on desktop, a drawer
 * below that. Opening a thread navigates the room pane only; this never
 * unmounts, so it never re-fetches or loses its scroll.
 */
export default function ChatSidebar({ inDrawer = false, onNavigate }) {
  const navigate = useNavigate();
  const { roomId: activeRoomId } = useParams();
  const { chatList, fetchChatList, loading } = useChatStore();
  const [term, setTerm] = useState('');
  const [tab, setTab] = useState('ALL');
  const pins = usePinStore((s) => s.pins);

  useEffect(() => {
    fetchChatList().catch(console.error);
  }, []);

  const all = useMemo(() => (Array.isArray(chatList) ? chatList : []), [chatList]);
  const unreadTotal = all.filter((c) => c.unreadCount > 0).length;

  const chats = useMemo(() => {
    const q = term.trim().toLowerCase();
    return all
      .filter((c) => tab === 'ALL' || c.projectType === tab)
      .filter((c) => !q
        || (c.title || '').toLowerCase().includes(q)
        || (c.interestName || '').toLowerCase().includes(q)
        || (c.lastMessagePreview || '').toLowerCase().includes(q))
      .sort((a, b) => {
        const pa = pins.has(a.chatRoomId) ? 1 : 0;
        const pb = pins.has(b.chatRoomId) ? 1 : 0;
        if (pa !== pb) return pb - pa;
        return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
      });
  }, [all, tab, term, pins]);

  const open = (id) => {
    navigate(`/chat/${id}`);
    onNavigate?.();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn('shrink-0 space-y-3 px-3 pb-3', !inDrawer && 'border-b border-line pt-4')}>
        {!inDrawer && (
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h1 className="font-display text-xl font-bold tracking-tight text-ink">Messages</h1>
            {unreadTotal > 0 && (
              <span className="text-xs font-medium text-accent-700 tnum">{unreadTotal} unread</span>
            )}
          </div>
        )}

        <label className="relative block">
          <span className="sr-only">Search conversations</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden="true" />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search conversations"
            className="h-9 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-mute/70 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25"
          />
        </label>

        <div role="tablist" aria-label="Filter conversations" className="flex gap-1 rounded-md bg-surface-2 p-0.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-1 rounded-[5px] px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                tab === t.key ? 'bg-surface text-ink shadow-sm' : 'text-mute hover:text-ink'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {loading && all.length === 0 ? (
          <ul className="space-y-1" aria-hidden="true">
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex animate-pulse items-center gap-3 rounded-lg px-2 py-2.5">
                <div className="h-10 w-10 shrink-0 rounded bg-line/60" />
                <div className="min-w-0 flex-1">
                  <div className="h-3 w-2/3 rounded-sm bg-line" />
                  <div className="mt-2.5 h-3 w-4/5 rounded-sm bg-line/60" />
                </div>
              </li>
            ))}
          </ul>
        ) : chats.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <MessageSquare className="mx-auto h-5 w-5 text-mute/60" strokeWidth={1.6} aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-ink">{term ? 'No conversations match' : 'No conversations yet'}</p>
            <p className="mt-1 text-xs text-mute">
              {term ? 'Try a name or an interest.' : 'Chats open as soon as you’re matched.'}
            </p>
            {!term && (
              <button
                onClick={() => navigate('/matches')}
                className="mt-3 rounded-sm text-xs font-semibold text-accent-700 hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                Find people
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {chats.map((chat) => {
              const unread = chat.unreadCount > 0;
              const active = chat.chatRoomId === activeRoomId;
              const pinned = pins.has(chat.chatRoomId);
              return (
                <li key={chat.chatRoomId}>
                  <button
                    onClick={() => open(chat.chatRoomId)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500',
                      active ? 'bg-accent-50' : unread ? 'bg-accent-50/50 hover:bg-accent-50' : 'hover:bg-surface-2/70'
                    )}
                  >
                    <ThreadAvatar type={chat.type} members={chat.members} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className={cn('min-w-0 flex-1 truncate text-sm', unread ? 'font-bold text-ink' : 'font-semibold text-ink')}>
                          {chat.title || chat.interestName || 'Chat'}
                        </span>
                        <span className={cn('shrink-0 text-[11px] tnum', unread ? 'font-semibold text-accent-700' : 'text-mute')}>
                          {listStamp(chat.lastMessageAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-mute">
                        {pinned && <Pin className="h-3 w-3 shrink-0 text-accent-600" aria-label="Pinned" />}
                        <span className="truncate">{chat.interestName}</span>
                        {chat.type && <span className="shrink-0">&middot; {TYPE_LABEL[chat.type] || chat.type}</span>}
                      </span>
                      <span className="mt-1 flex items-center gap-2">
                        <span className={cn('min-w-0 flex-1 truncate text-xs', unread ? 'font-semibold text-ink' : 'text-mute')}>
                          {chat.lastMessagePreview || <span className="italic text-mute/70">No messages yet</span>}
                        </span>
                        {unread && (
                          <span className="grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-accent-500 px-1 text-[10px] font-bold leading-none text-white tnum">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
