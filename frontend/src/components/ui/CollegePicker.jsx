import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { api } from '../../api/api';
import { cn } from '../../lib/utils';
import Spinner from './Spinner';

/**
 * Type-to-search college picker. There are well over a thousand colleges, so
 * instead of a native <select> this asks the server as you type: every word
 * must match the college's name, city or email domain ("iit mumbai", "pune
 * symbiosis", "iitb"). `value` is the selected college object (or null).
 */
export default function CollegePicker({ value, onChange, label = 'Your college', placeholder = 'Search by college name or city', className }) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const requestRef = useRef(0);

  // Debounced server search; stale responses (slower than a newer request) are dropped.
  useEffect(() => {
    if (!open) return undefined;
    const ticket = ++requestRef.current;
    setLoading(true);
    const timer = setTimeout(() => {
      api.get('/colleges/search', { params: { q: query.trim(), limit: 20 } })
        .then((list) => { if (ticket === requestRef.current) { setResults(Array.isArray(list) ? list : []); setActive(0); } })
        .catch(() => { if (ticket === requestRef.current) setResults([]); })
        .finally(() => { if (ticket === requestRef.current) setLoading(false); });
    }, query ? 220 : 0);
    return () => clearTimeout(timer);
  }, [query, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const choose = (college) => {
    onChange(college);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && open && results[active]) { e.preventDefault(); choose(results[active]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div ref={boxRef} className={cn('relative', className)}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>}

      {value && !open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); requestAnimationFrame(() => inputRef.current?.focus()); }}
          className="flex w-full items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5 text-left shadow-sm transition-colors hover:border-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">{value.name}</span>
            {value.city && <span className="block truncate text-xs text-mute">{value.city}</span>}
          </span>
          <span className="shrink-0 text-xs font-medium text-accent-700">Change</span>
        </button>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden="true" />
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            value={query}
            placeholder={placeholder}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className="w-full rounded-md border border-line bg-surface py-2.5 pl-9 pr-9 text-sm text-ink shadow-sm placeholder:text-mute/70 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
          />
          {query ? (
            <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-mute hover:text-ink">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden="true" />
          )}
        </div>
      )}

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-72 w-full overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-lg"
        >
          {loading && results.length === 0 ? (
            <li className="flex justify-center py-4 text-accent-500"><Spinner size="sm" /></li>
          ) : results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-mute">No college matches &ldquo;{query}&rdquo;. Try the city, or a shorter name.</li>
          ) : (
            results.map((c, i) => {
              const selected = value?.id === c.id;
              return (
                <li
                  key={c.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(e) => { e.preventDefault(); choose(c); }}
                  onMouseEnter={() => setActive(i)}
                  className={cn('flex cursor-pointer items-center gap-2 px-3 py-2', i === active ? 'bg-accent-50' : '')}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{c.name}</span>
                    <span className="block truncate text-xs text-mute">{[c.city, c.emailDomain].filter(Boolean).join(' · ')}</span>
                  </span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-accent-600" aria-hidden="true" />}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
