import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Avatar } from "../components/avatar";
import { setApiAuth } from "../api/client";
import { updateProfile, uploadAvatar } from "../api/messenger";
import { useAuth } from "../providers/auth-provider";
import { getUserDisplayName } from "../lib/display";

export function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { auth, setAuth } = useAuth();
  const [fullName, setFullName] = useState(auth?.user.fullName ?? "");
  const [username, setUsername] = useState(auth?.user.username ?? "");
  const [email, setEmail] = useState(auth?.user.email ?? "");
  const [phone, setPhone] = useState(auth?.user.phone ?? "");
  const [about, setAbout] = useState(auth?.user.about ?? "");
  const [country, setCountry] = useState(auth?.user.country ?? "");
  const [message, setMessage] = useState<string | null>(null);

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      if (!auth) return;
      const next = { ...auth, user: response.data };
      setAuth(next);
      setApiAuth(next);
      setMessage("Профиль сохранён");
    }
  });

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (response) => {
      if (!auth) return;
      const next = { ...auth, user: response.data };
      setAuth(next);
      setApiAuth(next);
      setMessage("Аватар обновлён");
    }
  });

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage(null);
    await avatarMutation.mutateAsync(file);
    event.target.value = "";
  }

  return (
    <div className="surface max-w-3xl p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Профиль</h1>
          <p className="mt-1 text-sm text-muted">Редактируйте имя, контакты, описание и аватар.</p>
        </div>
        <div className="flex items-center gap-4 rounded-3xl border border-stroke bg-canvas px-4 py-3">
          <Avatar title={getUserDisplayName(auth?.user)} avatarUrl={auth?.user.avatarUrl} className="h-14 w-14" />
          <div>
            <p className="font-semibold text-ink">{getUserDisplayName(auth?.user)}</p>
            <p className="text-sm text-muted">{auth?.user.username}</p>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleAvatarChange(event)} />

      <div className="mt-6 grid gap-4">
        <input className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Имя и фамилия" />
        <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Имя пользователя" />
        <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" />
        <input className="field" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Страна" />
        <textarea className="field min-h-28 resize-y" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="О себе" />
        {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
        {profileMutation.error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{profileMutation.error.message}</p>
        ) : null}
        {avatarMutation.error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{avatarMutation.error.message}</p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button className="primary-btn w-full md:w-auto" onClick={() => profileMutation.mutate({ fullName, username, email, phone, about, country })}>
            {profileMutation.isPending ? "Сохраняем..." : "Сохранить"}
          </button>
          <button className="secondary-btn w-full md:w-auto" onClick={() => fileInputRef.current?.click()}>
            {avatarMutation.isPending ? "Загружаем..." : "Загрузить аватар"}
          </button>
        </div>
      </div>
    </div>
  );
}
