export function SettingsPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="surface p-6">
        <h1 className="text-2xl font-semibold text-ink">Settings</h1>
        <p className="mt-2 text-sm text-muted">This MVP stores tokens locally, uses Socket.IO for realtime events, and fetches LiveKit tokens from the backend only.</p>
      </section>
      <section className="surface p-6">
        <h2 className="text-lg font-semibold text-ink">Security notes</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>Access token is sent as Bearer auth to REST requests.</li>
          <li>Refresh token is used only with `/api/auth/refresh`.</li>
          <li>LiveKit credentials never live in the browser bundle.</li>
        </ul>
      </section>
    </div>
  );
}
