import api from './api'

export const authService = {
  register: (name, email, voterId, password) =>
    api.post('/auth/register', { name, email, voterId, password }),

  login: (voterId, password) =>
    api.post('/auth/login', { voterId, password }),

  adminLogin: (username, password) =>
    api.post('/auth/admin/login', { username, password }),

  getMe: () =>
    api.get('/auth/me'),

  logout: () => {
    localStorage.removeItem('token')
  },
}
