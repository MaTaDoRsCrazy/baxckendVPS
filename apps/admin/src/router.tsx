import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/shell";
import { AuditLogPage } from "./pages/audit-log-page";
import { CallsPage } from "./pages/calls-page";
import { ChatsPage } from "./pages/chats-page";
import { DashboardPage } from "./pages/dashboard-page";
import { LoginPage } from "./pages/login-page";
import { MessagesPage } from "./pages/messages-page";
import { SecurityPage } from "./pages/security-page";
import { ServerPage } from "./pages/server-page";
import { UsersPage } from "./pages/users-page";
import { useAuth } from "./providers/auth-provider";
import { setApiAuth } from "./api/client";

function ProtectedLayout() {
  const { auth } = useAuth();
  setApiAuth(auth);

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  return <Shell />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/calls" element={<CallsPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/audit-log" element={<AuditLogPage />} />
        <Route path="/server" element={<ServerPage />} />
      </Route>
    </Routes>
  );
}
