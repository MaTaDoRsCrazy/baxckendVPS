import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../providers/auth-provider";

const links = [
  { to: "/dashboard", label: "Главная" },
  { to: "/users", label: "Пользователи" },
  { to: "/chats", label: "Чаты" },
  { to: "/messages", label: "Сообщения" },
  { to: "/calls", label: "Звонки" },
  { to: "/audit-log", label: "Журнал действий" },
  { to: "/server", label: "Сервер" }
];

export function Shell() {
  const { auth, logout } = useAuth();

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate">PulseLine Admin</p>
          <h1 className="mt-3 text-2xl font-bold text-ink">Панель управления</h1>
          <div className="mt-6 rounded-2xl bg-ink px-4 py-3 text-sm text-white">
            <p className="font-semibold">{auth?.user.username}</p>
            <p className="mt-1 text-white/70">{auth?.user.role}</p>
          </div>
          <nav className="mt-6 space-y-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? "bg-moss text-white" : "text-slate hover:bg-sand"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={logout}
            className="mt-8 w-full rounded-2xl border border-ember px-4 py-3 text-sm font-semibold text-ember transition hover:bg-ember hover:text-white"
          >
            Выйти
          </button>
        </aside>
        <main className="space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
