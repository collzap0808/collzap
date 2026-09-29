import { create } from 'zustand';
import { readPins, writePins } from '../pages/chat/chatFormat';

/** Pinned conversations — a per-device convenience, kept in this browser only. */
export const usePinStore = create((set, get) => ({
  pins: readPins(),
  togglePin: (id) => {
    const next = new Set(get().pins);
    if (next.has(id)) next.delete(id); else next.add(id);
    writePins(next);
    set({ pins: next });
  },
}));
