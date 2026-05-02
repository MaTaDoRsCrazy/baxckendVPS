import { COUNTRY_OPTIONS } from "@emessenger/shared";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setApiAuth } from "../api/client";
import { register } from "../api/messenger";
import { useAuth } from "../providers/auth-provider";

function createCaptcha() {
  const left = Math.floor(Math.random() * 9) + 1;
  const right = Math.floor(Math.random() * 9) + 1;
  return {
    left,
    right,
    answer: left + right
  };
}

export function RegisterPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState<string>(COUNTRY_OPTIONS[0].code);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [password, setPassword] = useState("");
  const [agreement, setAgreement] = useState(false);
  const [captcha, setCaptcha] = useState(createCaptcha());
  const [captchaValue, setCaptchaValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCountry = useMemo(
    () => COUNTRY_OPTIONS.find((option) => option.code === country) ?? COUNTRY_OPTIONS[0],
    [country]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!agreement) {
      setError("Подтвердите согласие с правилами сервиса");
      return;
    }

    if (Number(captchaValue) !== captcha.answer) {
      setError("Неверный ответ в проверке");
      setCaptcha(createCaptcha());
      setCaptchaValue("");
      return;
    }

    setLoading(true);
    try {
      const phone = phoneLocal.trim() ? `${selectedCountry.dialCode}${phoneLocal.replace(/[^\d]/g, "")}` : undefined;
      const response = await register({
        username: username.trim(),
        email: email.trim() || undefined,
        phone,
        password,
        country: selectedCountry.name
      });
      setAuth(response.data);
      setApiAuth(response.data);
      navigate("/chats", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось завершить регистрацию");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="surface w-full max-w-xl p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-muted">PulseLine</p>
        <h1 className="mt-4 text-3xl font-bold text-ink">Регистрация</h1>
        <p className="mt-2 text-sm text-muted">Создайте аккаунт, подтвердите согласие и пройдите простую проверку.</p>
        <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="field md:col-span-2" placeholder="Имя пользователя" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder="Email" />
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="field">
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name} ({option.dialCode})
              </option>
            ))}
          </select>
          <div className="field flex items-center gap-2">
            <span className="text-sm text-muted">{selectedCountry.dialCode}</span>
            <input
              value={phoneLocal}
              onChange={(e) => setPhoneLocal(e.target.value)}
              className="w-full bg-transparent outline-none"
              placeholder="Телефон"
            />
          </div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" placeholder="Пароль" />
          <div className="field flex items-center justify-between gap-3">
            <span className="text-sm text-muted">
              Сколько будет {captcha.left} + {captcha.right}?
            </span>
            <input
              value={captchaValue}
              onChange={(e) => setCaptchaValue(e.target.value)}
              className="w-20 bg-transparent text-right outline-none"
              placeholder="Ответ"
            />
          </div>
          <label className="md:col-span-2 flex items-start gap-3 rounded-2xl border border-stroke bg-canvas px-4 py-3 text-sm text-ink">
            <input type="checkbox" checked={agreement} onChange={(e) => setAgreement(e.target.checked)} className="mt-1" />
            <span>Согласен с правилами сервиса и обработкой данных для работы мессенджера.</span>
          </label>
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
