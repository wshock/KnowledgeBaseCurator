"use client";

import { useParams } from "next/navigation";
import { useDashboardStore } from "@/src/store/dashboard.store";

export default function ChatPage() {
  const { id } = useParams();
  const chat = useDashboardStore((state) =>
    state.chats.find((c) => c.id === id)
  );

  if (!chat) return <div>No existe el chat</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{chat.title}</h1>

      <div className="space-y-2">
        {chat.messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
    </div>
  );
}