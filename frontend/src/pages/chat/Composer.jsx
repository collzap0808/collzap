import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Paperclip, Send, Smile } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import { api } from '../../api/api';
import { cn } from '../../lib/utils';
import { snappy, transition, useReducedMotion } from '../../lib/motion';

// A short, study-group-shaped set rather than a full picker: the dozen or so
// people actually reach for in a working chat.
const EMOJI = ['😀', '😂', '🙂', '😅', '🤔', '😮', '🙏', '👍', '👏', '🙌', '💪', '🔥', '✅', '🎉', '💡', '📌', '📚', '💻', '🚀', '❤️'];

// Chat takes images only. `accept` is just a hint to the picker (Windows still
// offers "All files"), so the type and extension are checked again before upload;
// the server re-checks the actual bytes too.
const MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPT = IMAGE_TYPES.join(',');
const isChatImage = (file) => IMAGE_TYPES.includes(file.type) && /\.(jpe?g|png|webp)$/i.test(file.name);

/**
 * The message box. Image attachments upload first, then go into the thread as
 * their link — the chat stays plain text, and images render inline from that link.
 * `ref` exposes `focus()`, `insert(text)` and `attach()` so the workspace and
 * the empty state can drive it.
 */
export default function Composer({ ref, onSend, sending, suggestions = [], disabled }) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textRef = useRef(null);
  const fileRef = useRef(null);
  const emojiRef = useRef(null);

  // Grow with the text up to ~6 lines, then scroll.
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  useEffect(() => {
    if (!emojiOpen) return undefined;
    const onDown = (e) => { if (!emojiRef.current?.contains(e.target)) setEmojiOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setEmojiOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [emojiOpen]);

  const insert = (text) => {
    const el = textRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  useImperativeHandle(ref, () => ({
    focus: () => textRef.current?.focus(),
    insert: (text) => { setValue(text); requestAnimationFrame(() => textRef.current?.focus()); },
    attach: () => fileRef.current?.click(),
  }));

  const submit = async () => {
    if (!value.trim() || sending) return;
    // Cleared only on success, so a failed send never eats what was typed.
    if (await onSend(value)) setValue('');
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!isChatImage(file)) {
      toast.error('Only images (JPG, PNG or WebP) can be shared in chat.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('That image is over 5 MB');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('category', 'CHAT_ATTACHMENT');
      const { url } = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await onSend(url);
    } catch (error) {
      toast.error(error.message || 'That file did not upload');
    } finally {
      setUploading(false);
    }
  };

  const busy = sending || uploading;
  const showSuggestions = suggestions.length > 0 && !value.trim() && !busy;
  const iconBtn = 'grid h-9 w-9 shrink-0 place-items-center rounded-md text-mute transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-40';

  return (
    <div className="shrink-0 border-t border-line bg-surface px-2.5 py-2 sm:px-4 sm:pb-2.5 sm:pt-3">
      <div className="mx-auto w-full max-w-3xl">
        {/* Smart replies: one tap sends. Scroll sideways on phones so they
            never push the composer up. */}
        <AnimatePresence initial={false}>
          {showSuggestions && (
            <motion.div
              key="smart-replies"
              role="group"
              aria-label="Suggested replies"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
              transition={transition(snappy, reduced)}
              className="-mx-3 mb-2.5 flex gap-2 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
            >
              {suggestions.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => onSend(reply)}
                  disabled={busy}
                  className="shrink-0 whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-accent-400 hover:bg-accent-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={cn(
            'flex items-end gap-1 rounded-lg border border-line bg-surface-2/60 p-1 transition-[border-color,box-shadow]',
            'focus-within:border-accent-500 focus-within:ring-2 focus-within:ring-accent-500/20'
          )}
        >
          <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFile} tabIndex={-1} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy || disabled} aria-label="Attach an image" className={iconBtn}>
            {uploading ? <Spinner size="sm" /> : <Paperclip className="h-[18px] w-[18px]" aria-hidden="true" />}
          </button>

          <label htmlFor="chat-input" className="sr-only">Message</label>
          <textarea
            id="chat-input"
            ref={textRef}
            rows={1}
            value={value}
            disabled={disabled}
            placeholder="Write a message…"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            className="min-h-9 flex-1 resize-none bg-transparent px-1.5 py-2 text-sm leading-5 text-ink placeholder:text-mute/70 focus:outline-none"
          />

          <div ref={emojiRef} className="relative">
            <button
              type="button"
              onClick={() => setEmojiOpen((o) => !o)}
              aria-label="Add emoji"
              aria-expanded={emojiOpen}
              disabled={disabled}
              className={cn(iconBtn, emojiOpen && 'bg-surface-2 text-ink')}
            >
              <Smile className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
            <AnimatePresence>
              {emojiOpen && (
                <motion.div
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={transition(snappy, reduced)}
                  role="group"
                  aria-label="Emoji"
                  className="absolute bottom-11 right-0 z-20 grid w-60 grid-cols-5 gap-1 rounded-lg border border-line bg-surface p-2 shadow-lg"
                >
                  {EMOJI.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => { insert(em); setEmojiOpen(false); }}
                      className="grid h-9 place-items-center rounded-md text-lg transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                    >
                      {em}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!value.trim() || busy || disabled}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-accent-500 px-3.5 text-sm font-semibold text-white transition-colors',
              'hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
              'disabled:cursor-not-allowed disabled:bg-accent-500/40'
            )}
          >
            {sending ? <Spinner size="sm" className="text-current" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            <span className="hidden sm:inline">Send</span>
            <span className="sr-only sm:hidden">Send message</span>
          </button>
        </div>
        <p className="mt-1.5 hidden px-1 text-[10px] text-mute/70 sm:block">Enter to send &middot; Shift + Enter for a new line</p>
      </div>
    </div>
  );
}
