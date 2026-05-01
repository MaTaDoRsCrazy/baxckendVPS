import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../api/admin";
import { setApiAuth } from "../api/client";
import { useAuth } from "../providers/auth-provider";

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await loginAdmin(identifier, password);
      const role = response.data.user.role;
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        throw new Error("Admin access is allowed only for ADMIN and SUPER_ADMIN");
      }

      const auth = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        user: response.data.user
      };

      setApiAuth(auth);
      setAuth(auth);
      navigate("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="panel w-full max-w-md p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate">Secure Access</p>
        <h1 className="mt-4 text-3xl font-bold text-ink">Admin Login</h1>
        <p className="mt-2 text-sm text-slate">Use an ADMIN or SUPER_ADMIN account created by the backend seed script.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Email or username</span>
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-moss"
              placeholder="admin@example.com"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-moss"
              placeholder="••••••••"
            />
          </label>
          {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
