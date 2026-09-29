import { Fragment } from 'react';
import { motion } from 'motion/react';
import { Check, CheckCheck, FileText } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import { cn } from '../../lib/utils';
import { snappy, transition, useReducedMotion } from '../../lib/motion';
import { groupMessages, linkParts, soleAttachment, timeLabel } from './chatFormat';

function Receipt({ status }) {
  const base = 'h-3.5 w-3.5 shrink-0';
  if (status === 'READ') return <CheckCheck className={cn(base, 'text-accent-600')} aria-label="Read" />;
  if (status === 'DELIVERED') return <CheckCheck className={cn(base, 'text-mute')} aria-label="Delivered" />;
  return <Check className={cn(base, 'text-mute/70')} aria-label="Sent" />;
}

function Highlight({ text, term }) {
  if (!term) return text;
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-wait/30 text-inherit">{text.slice(i, i + term.length)}</mark>
      <Highlight text={text.slice(i + term.length)} term={term} />
    </>
  );
}

function MessageBody({ content, mine, term }) {
  const file = soleAttachment(content);
  if (file?.kind === 'image') {
    return (
      <a href={file.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md">
        <img src={file.url} alt="Shared image" loading="lazy" className="max-h-72 w-auto max-w-full bg-surface-2 object-contain" />
      </a>
    );
  }
  if (file?.kind === 'pdf') {
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        className={cn('inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline', mine ? 'text-white' : 'text-accent-700')}
      >
        <FileText className="h-4 w-4 shrink-0" aria-hidden="true" /> Shared PDF
      </a>
    );
  }
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {linkParts(content || '').map((part, i) => (part.url ? (
        <a
          key={i}
          href={part.url}
          target="_blank"
          rel="noreferrer"
          className={cn('break-all underline underline-offset-2', mine ? 'text-white decoration-white/50' : 'text-accent-700 decoration-accent-300')}
        >
          {part.url}
        </a>
      ) : (
        <Fragment key={i}><Highlight text={part.text} term={term} /></Fragment>
      )))}
    </p>
  );
}

/**
 * Messages grouped the way people read them: a day line, then runs of
 * consecutive messages from one person under a single name and time. Your own
 * runs sit right in solid accent; everyone else's sit left on the raised tone.
 */
export default function MessageList({ messages, joins = [], term }) {
  const reduced = useReducedMotion();
  const days = groupMessages(messages);

  return (
    <div className="mx-auto w-full max-w-3xl">
      {days.map((day) => (
        <section key={day.date.toDateString()} aria-label={day.label}>
          <div className="sticky top-0 z-[1] flex items-center gap-3 py-2 sm:py-3" role="separator">
            <span className="h-px flex-1 bg-line" />
            <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] font-medium text-mute">{day.label}</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="space-y-3 sm:space-y-4">
            {day.groups.map((group) => {
              const first = group.messages[0];
              const last = group.messages[group.messages.length - 1];
              return (
                <div
                  key={first.id || first.clientMessageId || first.sentAt}
                  className={cn('flex gap-2.5', group.mine ? 'justify-end' : 'justify-start')}
                >
                  {!group.mine && (
                    <Avatar src={group.senderPhotoUrl} name={group.senderName} size="sm" className="mt-5" />
                  )}
                  <div className={cn('flex min-w-0 max-w-[75%] flex-col gap-1', group.mine ? 'items-end' : 'items-start')}>
                    <p className="flex items-baseline gap-2 px-0.5 text-[11px]">
                      <span className="font-semibold text-ink/80">{group.mine ? 'You' : (group.senderName || 'Member')}</span>
                      <span className="text-mute tnum">{timeLabel(first.sentAt)}</span>
                    </p>
                    {group.messages.map((m, i) => {
                      const isFirst = i === 0;
                      const isLast = i === group.messages.length - 1;
                      const image = soleAttachment(m.content)?.kind === 'image';
                      return (
                        <motion.div
                          key={m.id || m.clientMessageId || `${m.sentAt}-${i}`}
                          initial={reduced ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={transition(snappy, reduced)}
                          className={cn(
                            'max-w-full rounded-lg',
                            image ? 'p-1' : 'px-3 py-2',
                            group.mine ? 'bg-accent-500 text-white' : 'border border-line bg-surface-2 text-ink',
                            // The corner nearest the speaker tightens between stacked bubbles.
                            group.mine && !isFirst && 'rounded-tr-sm',
                            group.mine && !isLast && 'rounded-br-sm',
                            !group.mine && !isFirst && 'rounded-tl-sm',
                            !group.mine && !isLast && 'rounded-bl-sm'
                          )}
                          title={timeLabel(m.sentAt)}
                        >
                          <MessageBody content={m.content} mine={group.mine} term={term} />
                        </motion.div>
                      );
                    })}
                    {group.mine && (
                      <span className="flex items-center gap-1 px-0.5 text-[11px] text-mute tnum">
                        {group.messages.length > 1 && timeLabel(last.sentAt)}
                        <Receipt status={last.receiptStatus} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* MEMBER_JOINED, as a quiet system line — never a bubble. */}
      {joins.map((join) => (
        <p key={join.id} className="py-3 text-center text-[11px] text-mute">
          <span className="font-medium text-ink/80">{join.name}</span> joined the conversation
        </p>
      ))}
    </div>
  );
}
