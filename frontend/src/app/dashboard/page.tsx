
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/src/store/dashboard.store";
import { ChatInput } from "@/src/components/dashboard/chat/ChatInput";

export default function Dashboard() {
  const router = useRouter();
  const createChat = useDashboardStore((state) => state.createChat);

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;
    const chatId = createChat(message);
    router.push(`/dashboard/chat/${chatId}`);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center justify-center h-full w-full px-4">
        <h1 className="text-2xl font-semibold mb-8 text-gray-800">
          Nuevo Chat
        </h1>
        <ChatInput onSend={handleSendMessage} />
      </div>
    </div>
  );
}