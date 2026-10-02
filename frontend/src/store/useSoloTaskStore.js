import { create } from 'zustand';
import { api } from '../api/api';

/**
 * Solo daily tasks: what a student works on before peer matching unlocks.
 * `soloTasks` is `{ locked, points, unlockPoints, tasks: [...] }`.
 */
export const useSoloTaskStore = create((set, get) => ({
  soloTasks: null,
  loading: false,
  submitting: false,
  // The task open in the desk's modal; shared so the header button can open it too.
  openTaskId: null,
  // Set when another page asks to open the next task before the list has loaded.
  pendingOpen: false,

  requestOpenNextTask: () => {
    if (!get().openNextTask()) set({ pendingOpen: true });
  },

  setOpenTaskId: (openTaskId) => set({ openTaskId }),

  /**
   * Opens the task that needs the student next: one to do or to fix, else the
   * first one. Returns false when there is nothing to open yet.
   */
  openNextTask: () => {
    const tasks = get().soloTasks?.tasks ?? [];
    const next = tasks.find((t) => !t.submission || t.submission.status === 'CHANGES_REQUESTED') ?? tasks[0];
    if (!next) return false;
    set({ openTaskId: next.assignmentId });
    return true;
  },

  fetchSoloTasks: async () => {
    set({ loading: true });
    try {
      const soloTasks = await api.get('/me/solo-tasks');
      set({ soloTasks, loading: false });
      if (get().pendingOpen) {
        set({ pendingOpen: false });
        get().openNextTask();
      }
      return soloTasks;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  submitSoloTask: async (assignmentId, payload) => {
    set({ submitting: true });
    try {
      const submission = await api.post(`/me/solo-tasks/${assignmentId}/submissions`, payload);
      set({ submitting: false });
      return submission;
    } catch (error) {
      set({ submitting: false });
      throw error;
    }
  },
}));
