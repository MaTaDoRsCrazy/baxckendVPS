import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { updateProfile } from "../api/messenger";
import { useAuth } from "../providers/auth-provider";
import { setApiAuth } from "../api/client";

export function ProfilePage() {
  const { auth, setAuth } = useAuth();
  const [username, setUsername] = useState(auth?.user.username ?? "");
  const [email, setEmail] = useState(auth?.user.email ?? "");
  const [phone, setPhone] = useState(auth?.user.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(auth?.user.avatarUrl ?? "");

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      if (!auth) return;
      const next = { ...auth, user: response.data };
      setAuth(next);
      setApiAuth(next);
    }
  });

  return (
    <div className="surface max-w-2xl p-6">
      <h1 className="text-2xl font-semibold text-ink">Profile</h1>
      <p className="mt-1 text-sm text-muted">Update your visible identity. Tokens stay in local storage until logout.</p>
      <div className="mt-6 grid gap-4">
        <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
        <input className="field" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="Avatar URL" />
        <button
          className="primary-btn w-full md:w-auto"
          onClick={() => mutation.mutate({ username, email, phone, avatarUrl })}
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
