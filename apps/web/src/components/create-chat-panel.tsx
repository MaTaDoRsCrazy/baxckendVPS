import type { User } from "@emessenger/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createGroupChat, createPrivateChat, searchUsers } from "../api/messenger";

export function CreateChatPanel() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const privateMutation = useMutation({
    mutationFn: createPrivateChat,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["chats"] })
  });
  const groupMutation = useMutation({
    mutationFn: ({ title, memberIds }: { title: string; memberIds: string[] }) => createGroupChat(title, memberIds),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["chats"] })
  });

  async function runSearch() {
    if (!query.trim()) return;
    const response = await searchUsers(query.trim());
    setResults(response.data);
  }

  function toggleUser(userId: string) {
    setSelectedIds((current) => (current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]));
  }

  return (
    <div className="surface p-4">
      <h3 className="text-lg font-semibold text-ink">Создать чат</h3>
      <div className="mt-4 flex gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="field" placeholder="Поиск пользователей" />
        <button className="secondary-btn" onClick={() => void runSearch()}>
          Поиск
        </button>
      </div>
      <div className="mt-3 max-h-52 space-y-2 overflow-auto">
        {results.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-2xl border border-stroke px-3 py-2">
            <div>
              <p className="font-medium text-ink">{user.username}</p>
              <p className="text-xs text-muted">{user.email ?? user.phone ?? "Нет публичных контактов"}</p>
            </div>
            <div className="flex gap-2">
              <button className="secondary-btn !px-3 !py-2" onClick={() => privateMutation.mutate(user.id)}>
                Личный
              </button>
              <button className="secondary-btn !px-3 !py-2" onClick={() => toggleUser(user.id)}>
                {selectedIds.includes(user.id) ? "Добавлен" : "В группу"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <input
          value={groupTitle}
          onChange={(event) => setGroupTitle(event.target.value)}
          className="field"
          placeholder="Название группы"
        />
        <button
          className="primary-btn mt-3 w-full"
          disabled={!groupTitle.trim() || selectedIds.length === 0}
          onClick={() => groupMutation.mutate({ title: groupTitle.trim(), memberIds: selectedIds })}
        >
          Создать группу
        </button>
      </div>
    </div>
  );
}
