import api from './api'

export const voteService = {
  getCandidates: () =>
    api.get('/vote/candidates'),

  castVote: (candidateId) =>
    api.post('/vote/vote', { candidateId }),

  getResults: () =>
    api.get('/vote/results'),

  getLiveResults: () =>
    api.get('/vote/results/live'),
}
