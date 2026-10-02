import { create } from 'zustand';
import { api } from '../api/api';

/** What to tell a student when there is no task to show, by the server's `emptyReason`. */
export function soloEmptyMessage(reason) {
  switch (reason) {
    case 'NOT_VERIFIED': return 'Your daily tasks start as soon as your student ID is approved.';
    case 'NO_INTERESTS': return 'Pick an interest on your profile to get daily tasks.';
    case 'NO_BANK': return "Tasks for your interests haven't been added yet. Check back soon.";
    case 'ALL_DONE': return "You've finished every task we have for now. New ones are on the way.";
    default: return 'Your first task is being prepared. Check back soon.';
  }
}

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
