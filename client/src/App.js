import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import PostDetail from './pages/PostDetail';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PublicRoute from './components/Auth/PublicRoute';
import Toast from './components/UI/Toast';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <AuthProvider>
            <SocketProvider>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={
                    <PublicRoute>
                      <Landing />
                    </PublicRoute>
                  } />
                  <Route path="/login" element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } />
                  <Route path="/register" element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  } />
                  
                  {/* Protected Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile/:userId?" element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/explore" element={
                    <ProtectedRoute>
                      <Layout>
                        <Explore />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <Layout>
                        <Notifications />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/post/:postId" element={
                    <ProtectedRoute>
                      <Layout>
                        <PostDetail />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Redirect unknown routes to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                
                <Toast />
              </div>
            </SocketProvider>
          </AuthProvider>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
