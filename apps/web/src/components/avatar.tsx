import { getAvatarFallback } from "@emessenger/shared";

interface AvatarProps {
  title?: string | null;
  avatarUrl?: string | null;
  className?: string;
}

export function Avatar({ title, avatarUrl, className = "" }: AvatarProps) {
  const fallback = getAvatarFallback({ name: title });

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={title ?? "Аватар"}
        className={`h-11 w-11 rounded-2xl object-cover ${className}`.trim()}
      />
    );
  }

  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean to-ink text-sm font-semibold text-white ${className}`.trim()}
    >
      {fallback}
    </div>
  );
}
