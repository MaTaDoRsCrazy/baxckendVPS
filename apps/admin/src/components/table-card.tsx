export function TableCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-200/70 px-6 py-5">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate">{subtitle}</p> : null}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}
