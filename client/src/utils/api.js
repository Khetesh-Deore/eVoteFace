import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 30000,
});

// Development mode flag
const isDevelopment = import.meta.env.MODE === 'development';

/**
 * Get current election ID from localStorage
 * @returns {string|null} Election ID or null
 */
export const getElectionId = () => {
  return localStorage.getItem('selectedElectionId');
};

/**
 * Validate election ID format
 * @param {string} electionId - Election ID to validate
 * @returns {boolean}
 */
const isValidElectionId = (electionId) => {
  if (!electionId || typeof electionId !== 'string') return false;
  
  // MongoDB ObjectId format (24 hex characters)
  const objectIdRegex = /^[a-f\d]{24}$/i;
  
  // UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  return objectIdRegex.test(electionId) || uuidRegex.test(electionId);
};

/**
 * Check if URL requires election context
 * @param {string} url - Request URL
 * @returns {boolean}
 */
const requiresElectionContext = (url) => {
  const electionScopedPaths = [
    '/elections/',
    '/votes/',
    '/voters/',
    '/admin/voters',
    '/admin/candidates',
    '/admin/election',
    '/admin/face',
  ];
  
  // Exclude election management endpoints
  const excludedPaths = [
    '/elections?',
    '/elections$',
  ];
  
  // Check if URL matches excluded patterns
  for (const pattern of excludedPaths) {
    if (new RegExp(pattern).test(url)) {
      return false;
    }
  }
  
  // Check if URL requires election context
  return electionScopedPaths.some(path => url.includes(path));
};

/**
 * Convert legacy API path to election-scoped path
 * @param {string} url - Original URL
 * @param {string} electionId - Election ID
 * @returns {string} Updated URL
 */
const convertToElectionScopedPath = (url, electionId) => {
  // Already election-scoped
  if (url.includes(`/elections/${electionId}`)) {
    return url;
  }
  
  // Legacy vote endpoints
  if (url.startsWith('/votes/')) {
    return url.replace('/votes/', `/elections/${electionId}/votes/`);
  }
  
  // Legacy voter endpoints
  if (url.startsWith('/voters/')) {
    return url.replace('/voters/', `/elections/${electionId}/voters/`);
  }
  
  // Legacy admin endpoints
  if (url.startsWith('/admin/voters')) {
    return url.replace('/admin/voters', `/elections/${electionId}/admin/voters`);
  }
  if (url.startsWith('/admin/candidates')) {
    return url.replace('/admin/candidates', `/elections/${electionId}/admin/candidates`);
  }
  if (url.startsWith('/admin/election')) {
    return url.replace('/admin/election', `/elections/${electionId}/admin`);
  }
  if (url.startsWith('/admin/face')) {
    return url.replace('/admin/face', `/elections/${electionId}/admin/face`);
  }
  
  return url;
};

/**
 * Log error to console in development
 * @param {string} context - Error context
 * @param {Error} error - Error object
 */
const logError = (context, error) => {
  if (isDevelopment) {
    console.error(`[${context}]`, error);
  }
  
  // TODO: Send to monitoring service (Sentry, LogRocket, etc.)
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { tags: { context } });
  // }
};

/**
 * Get user-friendly error message
 * @param {number} status - HTTP status code
 * @param {string} message - Server error message
 * @param {string} url - Request URL
 * @returns {string}
 */
const getUserFriendlyError = (status, message, url) => {
  // Election-specific errors
  if (status === 404 && url?.includes('/elections/')) {
    return 'Election not found. It may have been deleted or archived.';
  }
  
  if (status === 403) {
    if (message?.toLowerCase().includes('not registered')) {
      return 'You are not registered for this election. Please contact the administrator.';
    }
    if (message?.toLowerCase().includes('permission')) {
      return "You don't have permission to manage this election.";
    }
    if (message?.toLowerCase().includes('phase')) {
      return message; // Use server message for phase errors
    }
    return 'You are not authorized to access this election.';
  }
  
  if (status === 400) {
    if (message?.toLowerCase().includes('invalid') && message?.toLowerCase().includes('election')) {
      return 'Invalid election selected. Please choose a valid election.';
    }
    if (message?.toLowerCase().includes('ended') || message?.toLowerCase().includes('completed')) {
      return 'This election has ended. Voting is no longer allowed.';
    }
    if (message?.toLowerCase().includes('not started') || message?.toLowerCase().includes('registration')) {
      return "Voting hasn't started yet. Please wait for the voting phase to begin.";
    }
  }
  
  // Generic errors
  if (status === 401) {
    return 'Your session has expired. Please login again.';
  }
  
  if (status === 500) {
    return 'Server error occurred. Please try again later.';
  }
  
  if (status === 503) {
    return 'Service temporarily unavailable. Please try again in a few moments.';
  }
  
  // Return server message or generic error
  return message || 'An unexpected error occurred. Please try again.';
};

// Request interceptor: Attach JWT token and validate election context
api.interceptors.request.use(
  (config) => {
    // Attach JWT token
    const token = localStorage.getItem("evf_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Check if request requires election context
    if (requiresElectionContext(config.url)) {
      const electionId = getElectionId();
      
      // Validate election ID exists
      if (!electionId) {
        logError('Request Validation', new Error('No election selected'));
        toast.warning('Please select an election first', {
          toastId: 'no-election-selected',
        });
        return Promise.reject(new Error('No election selected'));
      }
      
      // Validate election ID format
      if (!isValidElectionId(electionId)) {
        logError('Request Validation', new Error('Invalid election ID format'));
        toast.error('Invalid election selected. Please choose another election.', {
          toastId: 'invalid-election-id',
        });
        localStorage.removeItem('selectedElectionId');
        return Promise.reject(new Error('Invalid election ID'));
      }
      
      // Convert legacy paths to election-scoped paths
      config.url = convertToElectionScopedPath(config.url, electionId);
      
      // Add election ID to headers for debugging
      config.headers['X-Election-Id'] = electionId;
    }
    
    return config;
  },
  (error) => {
    logError('Request Error', error);
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message;
    const url = err.config?.url;
    
    // Log error in development
    logError('API Response Error', {
      status,
      message,
      url,
      data: err.response?.data,
    });
    
    // Handle authentication errors
    if (status === 401) {
      const currentToken = localStorage.getItem("evf_token");
      if (currentToken) {
        localStorage.removeItem("evf_token");
        const path = window.location.pathname;
        if (!path.includes("/login") && !path.includes("/register")) {
          toast.error('Your session has expired. Please login again.', {
            toastId: 'session-expired',
          });
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        }
      }
      return Promise.reject(err);
    }
    
    // Handle election not found
    if (status === 404 && url?.includes('/elections/')) {
      const electionId = getElectionId();
      if (electionId && url.includes(electionId)) {
        localStorage.removeItem('selectedElectionId');
        
        toast.error('Election not found. It may have been deleted or archived.', {
          toastId: 'election-not-found',
          autoClose: 3000,
        });
        
        // Redirect to elections page
        setTimeout(() => {
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/admin/elections';
          } else {
            window.location.href = '/dashboard';
          }
        }, 2000);
      }
      return Promise.reject(err);
    }
    
    // Handle authorization errors
    if (status === 403) {
      const friendlyMessage = getUserFriendlyError(status, message, url);
      toast.error(friendlyMessage, {
        toastId: 'authorization-error',
        autoClose: 5000,
      });
      return Promise.reject(err);
    }
    
    // Handle validation errors
    if (status === 400) {
      const friendlyMessage = getUserFriendlyError(status, message, url);
      
      // Clear invalid election if needed
      if (message?.toLowerCase().includes('invalid') && message?.toLowerCase().includes('election')) {
        localStorage.removeItem('selectedElectionId');
      }
      
      toast.error(friendlyMessage, {
        toastId: 'validation-error',
        autoClose: 5000,
      });
      return Promise.reject(err);
    }
    
    // Handle server errors
    if (status >= 500) {
      const friendlyMessage = getUserFriendlyError(status, message, url);
      toast.error(friendlyMessage, {
        toastId: 'server-error',
        autoClose: 5000,
      });
      return Promise.reject(err);
    }
    
    // Handle network errors
    if (!err.response) {
      toast.error('Network error. Please check your internet connection.', {
        toastId: 'network-error',
        autoClose: 5000,
      });
      return Promise.reject(err);
    }
    
    // Generic error handling
    const friendlyMessage = getUserFriendlyError(status, message, url);
    if (friendlyMessage !== message) {
      toast.error(friendlyMessage, {
        toastId: 'generic-error',
        autoClose: 5000,
      });
    }
    
    return Promise.reject(err);
  }
);

/**
 * Election-scoped API helper methods
 * These methods automatically use the selected election ID
 */
export const electionAPI = {
  // Vote endpoints
  votes: {
    getResults: () => api.get('/votes/results'),
    getCandidates: () => api.get('/votes/candidates'),
    recordVote: (data) => api.post('/votes/record', data),
  },
  
  // Voter endpoints
  voters: {
    getStatus: () => api.get('/voters/status'),
    saveWallet: (walletAddress) => api.post('/voters/wallet', { walletAddress }),
    getProfile: () => api.get('/voters/profile'),
  },
  
  // Admin voter management
  admin: {
    voters: {
      getAll: (params) => api.get('/admin/voters', { params }),
      approve: (id) => api.post(`/admin/voters/${id}/approve`),
      registerOnChain: (id, walletAddress) => api.post(`/admin/voters/${id}/register-onchain`, { walletAddress }),
      uploadFace: (id, formData) => api.post(`/admin/voters/${id}/face`, formData),
      delete: (id) => api.delete(`/admin/voters/${id}`),
    },
    
    candidates: {
      getAll: () => api.get('/admin/candidates'),
      add: (data) => api.post('/admin/candidates', data),
      delete: (id) => api.delete(`/admin/candidates/${id}`),
    },
    
    election: {
      getDetails: () => api.get('/admin/election'),
      changePhase: (phase) => api.post('/admin/election/phase', { phase }),
    },
  },
};

export default api;
