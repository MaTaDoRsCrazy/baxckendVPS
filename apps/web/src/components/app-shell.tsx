import { Link, NavLink, Outlet } from "react-router-dom";
import { setApiAuth } from "../api/client";
import { logout as logoutRequest } from "../api/messenger";
import { useAuth } from "../providers/auth-provider";
import { IncomingCallBanner } from "./incoming-call-banner";

export function AppShell() {
  const { auth, logout } = useAuth();

  async function handleLogout() {
    try {
      if (auth?.refreshToken) {
        await logoutRequest(auth.refreshToken);
      }
    } catch {
      // Keep local logout even if backend is temporarily unavailable.
    } finally {
      setApiAuth(null);
      logout();
    }
  }

  return (
    <div className="min-h-screen px-3 py-3 md:px-5 md:py-5">
      <IncomingCallBanner />
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-3xl bg-ink px-5 py-4 text-white shadow-soft">
        <Link to="/chats" className="text-lg font-semibold tracking-[0.08em]">
          PulseLine
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <NavLink to="/chats" className={({ isActive }) => (isActive ? "text-white" : "text-white/70")}>
            Чаты
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? "text-white" : "text-white/70")}>
            Профиль
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "text-white" : "text-white/70")}>
            Настройки
          </NavLink>
          <button onClick={() => void handleLogout()} className="rounded-2xl border border-white/20 px-3 py-2 text-white/85">
            Выйти
          </button>
        </nav>
      </div>
      <div className="mx-auto mt-4 max-w-7xl">
        <Outlet />
      </div>
    </div>
  );
}
