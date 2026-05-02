import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setApiAuth } from "../api/client";
import { login } from "../api/messenger";
import { useAuth } from "../providers/auth-provider";

export function LoginPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login(identifier.trim(), password);
      setAuth(response.data);
      setApiAuth(response.data);
      navigate("/chats", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось выполнить вход");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="surface w-full max-w-md p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-muted">PulseLine</p>
        <h1 className="mt-4 text-3xl font-bold text-ink">Вход</h1>
        <p className="mt-2 text-sm text-muted">Войдите по email или имени пользователя и сразу попадёте в чаты.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="field"
            placeholder="Email или имя пользователя"
          />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" placeholder="Пароль" />
          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <button type="submit" className="primary-btn w-full" disabled={loading}>
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted">
          Нет аккаунта?{" "}
          <Link className="font-semibold text-ocean" to="/register">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
