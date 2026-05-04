export function translateAdminError(input?: string | null): string {
  if (!input) return "Что-то пошло не так";

  const normalized = input.trim();
  const map: Record<string, string> = {
    "Invalid credentials": "Неверный логин или пароль",
    "Request failed": "Не удалось выполнить запрос",
    "Invalid refresh token": "Сессия истекла, войдите снова",
    "Invalid access token": "Недействительный токен доступа",
    "Insufficient permissions": "Недостаточно прав",
    "Too many login attempts from this IP. Please try later.": "Слишком много неудачных попыток входа. Повторите позже",
    "Whitelisted IP address cannot be blocked": "Этот IP-адрес находится в белом списке и не может быть заблокирован",
    "Whitelisted IP range cannot be blocked": "Этот диапазон пересекается с белым списком и не может быть заблокирован",
    "Either ipAddress or cidr is required": "Укажите IP-адрес или CIDR",
    "Provide either ipAddress or cidr, not both": "Укажите только IP-адрес или только CIDR",
    "Invalid IP address": "Некорректный IP-адрес",
    "Invalid CIDR range": "Некорректный CIDR-диапазон",
    "Block reason is required": "Укажите причину блокировки",
    "Block expiration must be in the future": "Дата окончания блокировки должна быть в будущем",
    "Invalid block expiration date": "Некорректная дата окончания блокировки",
    "IP block already exists": "Такое правило блокировки уже существует",
    "IP block not found": "Правило блокировки не найдено",
    "Session not found": "Сессия не найдена",
    "Session expired": "Сессия уже завершена",
    "Refresh token mismatch": "Сессия больше не действительна",
    "Refresh token expired": "Срок действия refresh-токена истёк",
    "Доступ с этого IP-адреса заблокирован": "Доступ с этого IP-адреса заблокирован"
  };

  return map[normalized] ?? normalized;
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

export function formatDateTimeRu(value?: string | Date | null): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("ru-RU");
}

export function formatLocation(country?: string | null, city?: string | null): string {
  if (country && city) {
    return `${country}, ${city}`;
  }

  return country ?? city ?? "—";
}

export function formatBooleanRu(value?: boolean | null): string {
  if (value === true) return "Да";
  if (value === false) return "Нет";
  return "—";
}

export function truncateText(value?: string | null, maxLength = 48): string {
  if (!value) {
    return "—";
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}
