import { create } from 'zustand';
import { api } from '../api/api';

/** Daily tasks: today's assignment for a group, submissions, reviews, and the caller's own points/streak. */
export const useTaskStore = create((set) => ({
  todaysTask: null,
  myStats: null,
  calendar: null,
  loading: false,
  error: null,

  // `silent` is for background refreshes: it must not flip `loading`, or every
  // poll would briefly disable the submit form and the review modal mid-typing.
  fetchTodaysTask: async (groupId, { silent = false } = {}) => {
    if (!silent) set({ loading: true, error: null });
    try {
      const todaysTask = await api.get(`/matches/${groupId}/tasks/today`);
      set(silent ? { todaysTask } : { todaysTask, loading: false });
      return todaysTask;
    } catch (error) {
      if (!silent) set({ error: error.message, loading: false });
      throw error;
    }
  },

  submitTask: async (groupId, assignmentId, payload) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/matches/${groupId}/tasks/${assignmentId}/submissions`, payload);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  reviewSubmission: async (groupId, submissionId, scores) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/matches/${groupId}/tasks/submissions/${submissionId}/reviews`, scores);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // `month` is "YYYY-MM"; omitted means the current IST month (server decides).
  fetchCalendar: async (month) => {
    try {
      const calendar = await api.get('/me/task-stats/calendar', { params: month ? { month } : {} });
      set({ calendar });
      return calendar;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchMyStats: async () => {
    try {
      const myStats = await api.get('/me/task-stats');
      set({ myStats });
      return myStats;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
}));
