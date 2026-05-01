export function SettingsPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="surface p-6">
        <h1 className="text-2xl font-semibold text-ink">Настройки</h1>
        <p className="mt-2 text-sm text-muted">
          В этой версии токены хранятся локально, realtime работает через Socket.IO, а токены LiveKit запрашиваются только с backend.
        </p>
      </section>
      <section className="surface p-6">
        <h2 className="text-lg font-semibold text-ink">Безопасность</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>Access token передаётся как Bearer-токен в REST-запросах.</li>
          <li>Refresh token используется только в `/api/auth/refresh`.</li>
          <li>Секреты LiveKit никогда не попадают в браузерный bundle.</li>
        </ul>
      </section>
    </div>
  );
}
