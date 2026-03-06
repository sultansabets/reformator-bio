import { Navigate, useLocation } from "react-router-dom";
import { getAccessToken } from "@/api/apiClient";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const hasToken = !!getAccessToken();
  const location = useLocation();

  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
