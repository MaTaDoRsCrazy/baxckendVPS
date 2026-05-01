import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/app-shell";
import { ProtectedRoute } from "./components/protected-route";
import { ChatsPage } from "./pages/chats-page";
import { LoginPage } from "./pages/login-page";
import { ProfilePage } from "./pages/profile-page";
import { RegisterPage } from "./pages/register-page";
import { SettingsPage } from "./pages/settings-page";

const CallPage = lazy(async () => import("./pages/call-page").then((module) => ({ default: module.CallPage })));

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/chats" replace />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/chats/:chatId" element={<ChatsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/call/:callId"
          element={
            <Suspense fallback={<div className="surface p-6">Loading call screen...</div>}>
              <CallPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
