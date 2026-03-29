import api from './api'

export const adminService = {
  getVoters: () =>
    api.get('/admin/voters'),

  approveVoter: (voterId) =>
    api.patch(`/admin/voters/${voterId}/approve`),

  rejectVoter: (voterId) =>
    api.delete(`/admin/voters/${voterId}/reject`),

  addCandidate: (name, party, partySymbol) =>
    api.post('/admin/candidates', { name, party, partySymbol }),

  updateCandidate: (candidateId, data) =>
    api.patch(`/admin/candidates/${candidateId}`, data),

  deleteCandidate: (candidateId) =>
    api.delete(`/admin/candidates/${candidateId}`),

  startElection: (title, endTime) =>
    api.post('/admin/election/start', { title, endTime }),

  stopElection: () =>
    api.patch('/admin/election/stop'),

  getElection: () =>
    api.get('/admin/election'),

  getDashboardStats: () =>
    api.get('/admin/dashboard'),

  getAuditLog: () =>
    api.get('/admin/audit-log'),
}
