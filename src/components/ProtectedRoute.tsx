import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If adminOnly is true, you can check user role here
  // For now, just check if user exists
  if (adminOnly) {
    // Add your admin check logic here based on your AuthContext
    // Example: if (!user.isAdmin) return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
