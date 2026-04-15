import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 60000, // 60 seconds for face verification
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("evf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Token expired — clear and let components handle redirect
      const currentToken = localStorage.getItem("evf_token");
      if (currentToken) {
        localStorage.removeItem("evf_token");
        // Only redirect if not already on auth pages
        const path = window.location.pathname;
        if (!path.includes("/login") && !path.includes("/register")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
