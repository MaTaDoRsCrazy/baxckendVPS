import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/auth-provider";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
