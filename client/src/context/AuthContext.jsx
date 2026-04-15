import { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('evf_token'));
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Login function
  const login = async (credentials, isAdminLogin = false) => {
    try {
      const endpoint = isAdminLogin ? '/auth/admin/login' : '/auth/login';
      const response = await api.post(endpoint, credentials);

      const { token: authToken, user: userData, admin: adminData } = response.data;

      setToken(authToken);
      localStorage.setItem('evf_token', authToken);

      const userInfo = userData || adminData;
      setUser(userInfo);
      setIsAdmin(userInfo.role === 'admin' || userInfo.role === 'superadmin');

      return userInfo;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('evf_token');
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Get current user
  const getCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setIsAdmin(response.data.role === 'admin' || response.data.role === 'superadmin');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      logout();
      return null;
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('evf_token');
      if (storedToken) {
        setToken(storedToken);
        await getCurrentUser();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const value = {
    user,
    token,
    loading,
    isAdmin,
    login,
    logout,
    register,
    getCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
