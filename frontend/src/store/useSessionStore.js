import { create } from 'zustand';
import { api } from '../api/api';

/** Mentoring sessions for the caller's interests: the list, one session, and earning its points. */
export const useSessionStore = create((set) => ({
  sessions: null, // { featured, available, upcoming }
  current: null,
  loading: false,
  error: null,

  fetchSessions: async () => {
    set({ loading: true, error: null });
    try {
      const sessions = await api.get('/sessions');
      set({ sessions, loading: false });
      return sessions;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchSession: async (id) => {
    set({ loading: true, error: null, current: null });
    try {
      const current = await api.get(`/sessions/${id}`);
      set({ current, loading: false });
      return current;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // No `loading` flip for these two: they fire mid-playback and must not
  // re-render the player into a spinner.
  startSession: async (id) => {
    const current = await api.post(`/sessions/${id}/start`);
    set({ current });
    return current;
  },

  completeSession: async (id) => {
    const result = await api.post(`/sessions/${id}/complete`);
    set({ current: result.session });
    return result;
  },
}));
