import { MessagesSquare } from 'lucide-react';

/** `/chat` index — the room pane on desktop, beside the list, before anything is open. */
export default function ChatEmptySelection() {
  return (
    <div className="flex h-full flex-1 items-center justify-center rounded-lg border border-line bg-surface p-8">
      <div className="max-w-xs text-center">
        <MessagesSquare className="mx-auto h-6 w-6 text-mute/60" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="mt-3 font-display text-base font-bold tracking-tight text-ink">Pick a conversation</h2>
        <p className="mt-1 text-sm text-mute">Choose someone from Messages to pick up where you left off.</p>
      </div>
    </div>
  );
}
