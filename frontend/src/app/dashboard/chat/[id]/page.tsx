"use client";

import { useParams } from "next/navigation";
import { useDashboardStore } from "@/src/store/dashboard.store";
import { ChatInput } from "@/src/components/dashboard/chat/ChatInput";
import { useEffect, useRef } from "react";

export default function ChatPage() {
  const params = useParams();
  const id = params.id as string;

  const chat = useDashboardStore((state) =>
    state.chats.find((c) => c.id === id)
  );
  const updateChat = useDashboardStore((state) => state.updateChat);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  const handleSendMessage = (message: string) => {
    if (!message.trim() || !chat) return;

    const newMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: message,
      timestamp: new Date(),
    };

    updateChat(id, {
      messages: [...chat.messages, newMessage],
      updatedAt: new Date(),
    });
  };

  if (!chat) {
    return <div className="p-4">Chat no encontrado</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        <h1 className="text-xl font-bold mb-4">{chat.title}</h1>

        <div className="space-y-4">
          {chat.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-blue-950 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                <p>{msg.content}</p>
              </div>
            </div>
          ))}

          {/* 👇 ESTE ES EL TRUCO DEL SCROLL */}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="p-4 mb-4">
        <ChatInput onSend={handleSendMessage} />
      </div>
    </div>
  );
}