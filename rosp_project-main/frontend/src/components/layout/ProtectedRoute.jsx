import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen label="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation
  if (allowedRole && user?.role !== allowedRole) {
    // If student tries to open admin route -> redirect to student home
    if (user?.role === 'student' && allowedRole === 'admin') {
      return <Navigate to="/student" replace />;
    }
    // If admin tries to open student route -> redirect to admin home
    if (user?.role === 'admin' && allowedRole === 'student') {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
