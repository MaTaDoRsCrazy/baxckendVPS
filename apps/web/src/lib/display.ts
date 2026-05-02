import { getAvatarFallback, getDisplayName, type Conversation, type Message, type User } from "@emessenger/shared";

export function getUserDisplayName(user?: Partial<User> | null) {
  return getDisplayName(user ?? {});
}

export function getUserAvatarFallback(user?: Partial<User> | null) {
  return getAvatarFallback(user ?? {});
}

export function getConversationTitle(conversation: Partial<Conversation> | null | undefined, currentUserId?: string | null) {
  if (!conversation) {
    return "Чат";
  }

  if (conversation.title?.trim()) {
    return conversation.title.trim();
  }

  const otherMembers = (conversation.members ?? [])
    .filter((member) => member.userId !== currentUserId)
    .map((member) => getUserDisplayName(member.user))
    .filter(Boolean);

  return otherMembers.join(", ") || "Новый чат";
}

export function getMessagePreview(message?: Partial<Message> | null) {
  if (!message) {
    return "Сообщений пока нет";
  }

  if (message.isDeleted) {
    return "Сообщение удалено";
  }

  if (message.type === "IMAGE") {
    return message.attachmentName ? `Изображение: ${message.attachmentName}` : "Изображение";
  }

  if (message.type === "VOICE") {
    return "Голосовое сообщение";
  }

  if (message.type === "FILE") {
    return message.attachmentName ? `Файл: ${message.attachmentName}` : "Файл";
  }

  return message.body?.trim() || "Сообщение";
}
