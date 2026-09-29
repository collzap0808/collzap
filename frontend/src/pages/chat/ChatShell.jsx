import { Outlet, useParams } from 'react-router-dom';
import { cn } from '../../lib/utils';
import ChatSidebar from './ChatSidebar';

/**
 * The chat workspace: conversation list | conversation | workspace, each its
 * own box. The conversation is the widest and gets the strongest type, which
 * is what keeps it the focus. The room page owns the third column because it
 * belongs to whichever conversation is open.
 *
 * Below `lg` there is room for one pane: the list is the whole screen with
 * nothing open, the room is once one is — and the list comes back as a drawer
 * from the room header.
 */
export default function ChatShell() {
  const { roomId } = useParams();

  return (
    <div className="flex h-[calc(100dvh-var(--app-chrome,9rem))] gap-3 md:gap-5">
      <aside
        aria-label="Conversations"
        className={cn(
          'min-h-0 shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-surface',
          'lg:flex lg:w-[280px] xl:w-[22%] xl:min-w-[260px] xl:max-w-[380px]',
          roomId ? 'hidden' : 'flex w-full'
        )}
      >
        <ChatSidebar />
      </aside>

      <div className={cn('min-h-0 min-w-0 flex-1 flex-col', roomId ? 'flex' : 'hidden lg:flex')}>
        <Outlet />
      </div>
    </div>
  );
}
