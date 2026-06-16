import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore.js';
import { useSocketStore } from './store/useSocketStore.js';

// Layout & Pages
import MainLayout from './layouts/MainLayout.js';
import Loader from './components/ui/Loader.js';

const Login = lazy(() => import('./pages/Login.js'));
const Register = lazy(() => import('./pages/Register.js'));
const Chats = lazy(() => import('./pages/Chats.js'));
const Discover = lazy(() => import('./pages/Discover.js'));
const Requests = lazy(() => import('./pages/Requests.js'));
const Profile = lazy(() => import('./pages/Profile.js'));
const Settings = lazy(() => import('./pages/Settings.js'));

// Protected Route Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, token } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Public Route Guard (Redirects to chat if logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, token } = useAuthStore();

  if (isAuthenticated && token) {
    return <Navigate to="/chats" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { isAuthenticated, token, checkAuth, isLoading } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();

  // Run auth check on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Connect/disconnect Socket.IO based on auth state
  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token, connectSocket, disconnectSocket]);

  if (isLoading && !isAuthenticated) {
    return <Loader fullscreen label="INITIALIZING RELAY..." />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<Loader fullscreen label="LOADING VIEW..." />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Dashboard Layout Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Default redirect to chats */}
          <Route index element={<Navigate to="/chats" replace />} />
          
          <Route path="chats" element={<Chats />} />
          <Route path="discover" element={<Discover />} />
          <Route path="requests" element={<Requests />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/chats" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
