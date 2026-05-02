export function translateWebError(input?: string | null): string {
  if (!input) return "Что-то пошло не так";

  const normalized = input.trim();
  const map: Record<string, string> = {
    "Invalid credentials": "Неверный логин или пароль",
    "Invalid email": "Некорректный email",
    "Password is required": "Введите пароль",
    "User not found": "Пользователь не найден",
    "Network error": "Ошибка сети",
    "Request failed": "Не удалось выполнить запрос",
    "Message body or attachment is required": "Сообщение не может быть пустым",
    "Call not found": "Звонок не найден",
    "User is not a conversation member": "У вас нет доступа к этому чату",
    "User is not a call participant": "У вас нет доступа к этому звонку",
    "User is not allowed to join this call": "У вас нет доступа к этому звонку",
    "Cannot create a private chat with yourself": "Нельзя создать личный чат с самим собой",
    "User with provided username or email already exists": "Пользователь с таким именем или email уже существует",
    "Unsupported file type": "Этот тип файла не поддерживается",
    "File is required": "Выберите файл",
    "File exceeds 15MB limit": "Файл превышает лимит 15 МБ",
    "Multipart boundary is missing": "Не удалось обработать файл",
    "Session not found": "Сессия не найдена",
    "Refresh token expired": "Сессия истекла, войдите снова",
    "Refresh token mismatch": "Сессия истекла, войдите снова",
    "User is blocked": "Аккаунт заблокирован",
    "User is deleted": "Аккаунт удалён",
    "Insufficient permissions": "Недостаточно прав"
  };

  return map[normalized] ?? normalized;
}

export function formatTimeRu(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatChatDateRu(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfTarget.getTime()) / 86_400_000);

  if (diffDays === 0) return formatTimeRu(date);
  if (diffDays === 1) return "Вчера";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

export function formatConversationTypeRu(type?: string | null): string {
  if (type === "PRIVATE") return "Личный";
  if (type === "GROUP") return "Группа";
  return "Чат";
}

export function formatCallTypeRu(type?: string | null): string {
  if (type === "AUDIO") return "Аудиозвонок";
  if (type === "VIDEO") return "Видеозвонок";
  return "Звонок";
}

export function formatBytes(size?: number | null): string {
  if (!size || size <= 0) {
    return "0 Б";
  }

  const units = ["Б", "КБ", "МБ", "ГБ"];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 || unitIndex === 0 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`;
}
