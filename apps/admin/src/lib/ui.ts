export function translateAdminError(input?: string | null): string {
  if (!input) return "Что-то пошло не так";

  const normalized = input.trim();
  const map: Record<string, string> = {
    "Invalid credentials": "Неверный логин или пароль",
    "Request failed": "Не удалось выполнить запрос",
    "Invalid refresh token": "Сессия истекла, войдите снова",
    "Invalid access token": "Недействительный токен доступа",
    "Insufficient permissions": "Недостаточно прав"
  };

  return map[normalized] ?? "Что-то пошло не так";
}

export function formatRoleRu(role?: string | null): string {
  const map: Record<string, string> = {
    USER: "Пользователь",
    MODERATOR: "Модератор",
    ADMIN: "Администратор",
    SUPER_ADMIN: "Супер-админ"
  };

  return role ? (map[role] ?? role) : "—";
}

export function formatStatusRu(status?: string | null): string {
  const map: Record<string, string> = {
    ACTIVE: "Активен",
    BLOCKED: "Заблокирован",
    DELETED: "Удалён",
    RINGING: "Идёт вызов",
    ACCEPTED: "Принят",
    REJECTED: "Отклонён",
    MISSED: "Пропущен",
    ENDED: "Завершён"
  };

  return status ? (map[status] ?? status) : "—";
}

export function formatConversationTypeRu(type?: string | null): string {
  if (type === "PRIVATE") return "Личный";
  if (type === "GROUP") return "Группа";
  return type ?? "—";
}
