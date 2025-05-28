import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  isAuthenticated: false
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { showToast } = useToast();

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.data.user,
              token
            }
          });
        } catch (error) {
          console.error('Error loading user:', error);
          localStorage.removeItem('token');
          dispatch({ type: 'AUTH_ERROR' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { user, accessToken } = response.data.data;

      // Store token in localStorage
      localStorage.setItem('token', accessToken);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user,
          token: accessToken
        }
      });

      showToast('Login successful!', 'success');
      return { success: true };
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR' });
      const message = error.response?.data?.message || 'Login failed';
      showToast(message, 'error');
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const formData = new FormData();
      Object.keys(userData).forEach(key => {
        if (userData[key] !== null && userData[key] !== undefined) {
          formData.append(key, userData[key]);
        }
      });

      const response = await api.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const { user, accessToken } = response.data.data;

      // Store token in localStorage
      localStorage.setItem('token', accessToken);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user,
          token: accessToken
        }
      });

      showToast('Registration successful!', 'success');
      return { success: true };
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR' });
      const message = error.response?.data?.message || 'Registration failed';
      showToast(message, 'error');
      return { success: false, message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      showToast('Logged out successfully', 'success');
    }
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      const formData = new FormData();
      Object.keys(userData).forEach(key => {
        if (userData[key] !== null && userData[key] !== undefined) {
          formData.append(key, userData[key]);
        }
      });

      const response = await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.data.user
      });

      showToast('Profile updated successfully!', 'success');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      showToast(message, 'error');
      return { success: false, message };
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    dispatch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 