import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/messenger";
import { setApiAuth } from "../api/client";
import { useAuth } from "../providers/auth-provider";

export function RegisterPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await register({ username, email, phone, password });
      setAuth(response.data);
      setApiAuth(response.data);
      navigate("/chats");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось завершить регистрацию");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="surface w-full max-w-lg p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-muted">PulseLine</p>
        <h1 className="mt-4 text-3xl font-bold text-ink">Регистрация</h1>
        <p className="mt-2 text-sm text-muted">Безопасный мессенджер в реальном времени</p>
        <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="field md:col-span-2" placeholder="Имя пользователя" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder="Email" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="field" placeholder="Телефон" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field md:col-span-2" placeholder="Пароль" />
          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">{error}</p> : null}
          <button type="submit" className="primary-btn md:col-span-2" disabled={loading}>
            {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted">
          Уже есть аккаунт?{" "}
          <Link className="font-semibold text-ocean" to="/login">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
