import { create } from 'zustand';
import { api } from '../api/api';

const defaultPage = { content: [], page: 0, totalPages: 1, last: true };

export const useAdminStore = create((set) => ({
  stats: null,
  users: defaultPage,
  verifications: defaultPage,
  matches: defaultPage,
  queue: [],
  reports: defaultPage,
  collegeApplications: defaultPage,
  adminColleges: defaultPage,
  interestFeedback: defaultPage,
  questions: defaultPage,
  interests: [],
  taskBanks: [],
  sessions: [],
  soloSubmissions: [],
  soloPendingCount: 0,
  loading: false,
  error: null,

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await api.get('/admin/stats');
      set({ stats, loading: false });
      return stats;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchUsers: async (search = null, status = null, page = 0) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ page });
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      
      const users = await api.get(`/admin/users?${params.toString()}`);
      set({ users, loading: false });
      return users;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      const user = await api.get(`/admin/users/${userId}`);
      set({ loading: false });
      return user; // Usually component handles local state for single user view
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /** Permanent hard delete — everything the user ever created goes with them. */
  deleteUser: async (userId, reason) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/admin/users/${userId}/delete`, { reason });
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchPendingVerifications: async (page = 0) => {
    set({ loading: true, error: null });
    try {
      const verifications = await api.get(`/admin/verifications?page=${page}`);
      set({ verifications, loading: false });
      return verifications;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  reviewDocument: async (documentId, approve, note = null) => {
    set({ loading: true, error: null });
    try {
      const payload = note ? { approve, note } : { approve };
      const response = await api.post(`/admin/verifications/${documentId}/review`, payload);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchCollegeApplications: async (status = null, page = 0) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ page });
      if (status) params.append('status', status);

      const collegeApplications = await api.get(`/admin/college-applications?${params.toString()}`);
      set({ collegeApplications, loading: false });
      return collegeApplications;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  reviewCollegeApplication: async (applicationId, approve, note = null) => {
    set({ loading: true, error: null });
    try {
      const payload = note ? { approve, note } : { approve };
      const response = await api.post(`/admin/college-applications/${applicationId}/review`, payload);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchMatches: async (status = null, page = 0) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ page });
      if (status) params.append('status', status);
      
      const matches = await api.get(`/admin/matches?${params.toString()}`);
      set({ matches, loading: false });
      return matches;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchQueue: async () => {
    set({ loading: true, error: null });
    try {
      const queue = await api.get('/admin/queue');
      set({ queue, loading: false });
      return queue;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createMatch: async (userIds, interestId, connectionType, projectType) => {
    set({ loading: true, error: null });
    try {
      const payload = { userIds, interestId, connectionType, projectType };
      const response = await api.post('/admin/matches', payload);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  unmatch: async (matchGroupId, userId = null) => {
    set({ loading: true, error: null });
    try {
      const payload = userId ? { matchGroupId, userId } : { matchGroupId };
      const response = await api.post('/admin/matches/unmatch', payload);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchReports: async (page = 0) => {
    set({ loading: true, error: null });
    try {
      const reports = await api.get(`/admin/reports?page=${page}`);
      set({ reports, loading: false });
      return reports;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchInterestFeedback: async (page = 0) => {
    set({ loading: true, error: null });
    try {
      const interestFeedback = await api.get(`/admin/interest-feedback?page=${page}`);
      set({ interestFeedback, loading: false });
      return interestFeedback;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Every college (active or not), searched by name / city / domain, one page at a time.
  fetchAdminColleges: async (q = null, page = 0, size = 25) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ page: String(page), size: String(size) });
      if (q) params.set('q', q);
      const adminColleges = await api.get(`/admin/colleges?${params.toString()}`);
      set({ adminColleges, loading: false });
      return adminColleges;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createCollege: async (name, emailDomain, city = null) => {
    set({ loading: true, error: null });
    try {
      const payload = city ? { name, emailDomain, city } : { name, emailDomain };
      const response = await api.post('/admin/colleges', payload);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateCollege: async (id, name, emailDomain, city = null) => {
    set({ loading: true, error: null });
    try {
      const payload = city ? { name, emailDomain, city } : { name, emailDomain };
      const response = await api.post(`/admin/colleges/${id}`, payload);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteCollege: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/admin/colleges/${id}/delete`);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchQuestions: async (interestId = null, page = 0) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ page });
      if (interestId) params.append('interestId', interestId);
      const questions = await api.get(`/admin/questions?${params.toString()}`);
      set({ questions, loading: false });
      return questions;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createQuestion: async (questionText, options, interestId) => {
    set({ loading: true, error: null });
    try {
      const payload = { questionText, options, interestId };
      const response = await api.post('/admin/questions', payload);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateQuestion: async (id, questionText, options, interestId) => {
    set({ loading: true, error: null });
    try {
      const payload = { questionText, options, interestId };
      const response = await api.post(`/admin/questions/${id}`, payload);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteQuestion: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/admin/questions/${id}/delete`);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteAllQuestions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/admin/questions/delete-all');
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchInterests: async () => {
    set({ loading: true, error: null });
    try {
      const interests = await api.get('/admin/interests');
      set({ interests, loading: false });
      return interests;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createInterest: async (name, category) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/admin/interests', { name, category });
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateInterest: async (id, name) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/admin/interests/${id}`, { name });
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteInterest: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/admin/interests/${id}/delete`);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchTaskBanks: async (interestId = null) => {
    set({ loading: true, error: null });
    try {
      const params = interestId ? `?interestId=${interestId}` : '';
      const taskBanks = await api.get(`/admin/task-banks${params}`);
      set({ taskBanks, loading: false });
      return taskBanks;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchTaskBankItems: async (taskBankId) => {
    set({ loading: true, error: null });
    try {
      const items = await api.get(`/admin/task-banks/${taskBankId}/items`);
      set({ loading: false });
      return items;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  uploadTaskBank: async (interestId, title, tasks, track = 'GROUP') => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/admin/task-banks', { interestId, title, tasks, track });
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deactivateTaskBank: async (taskBankId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/admin/task-banks/${taskBankId}/deactivate`);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchSessions: async () => {
    set({ loading: true, error: null });
    try {
      const sessions = await api.get('/admin/sessions');
      set({ sessions, loading: false });
      return sessions;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  saveSession: async (id, payload) => {
    const session = id
      ? await api.put(`/admin/sessions/${id}`, payload)
      : await api.post('/admin/sessions', payload);
    return session;
  },

  deleteSession: async (id) => {
    return api.delete(`/admin/sessions/${id}`);
  },

  // Solo-task review queue (students who haven't unlocked matching yet).
  fetchSoloSubmissions: async (status = 'PENDING') => {
    set({ loading: true, error: null });
    try {
      const soloSubmissions = await api.get('/admin/solo-submissions', { params: { status } });
      set({ soloSubmissions, loading: false });
      return soloSubmissions;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchSoloPendingCount: async () => {
    const { pending } = await api.get('/admin/solo-submissions/pending-count');
    set({ soloPendingCount: pending });
    return pending;
  },

  reviewSoloSubmission: async (submissionId, payload) => {
    return api.post(`/admin/solo-submissions/${submissionId}/review`, payload);
  },

  runTaskRolloverNow: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/admin/task-banks/run-now');
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
