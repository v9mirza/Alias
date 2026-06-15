import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Allow sending HTTP-only cookies if backend uses them
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('alias_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors cleanly
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check for 401 Unauthorized to potentially clear session
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('alias_token');
      // Optional: Redirect or trigger store reset if needed
    }
    
    // Format error message to be thrown to callers
    const errorMessage = error.response?.data?.message || 'Something went wrong';
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
