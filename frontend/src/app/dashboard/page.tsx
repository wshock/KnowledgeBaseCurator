"use client";

import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/src/store/dashboard.store";
import { ChatInput } from "@/src/components/dashboard/chat/ChatInput";
import { sendMessageToAgent } from "@/src/services/agent.service";

export default function Dashboard() {
  const router = useRouter();
  const createChat = useDashboardStore((state) => state.createChat);
  const addAgentMessage = useDashboardStore((state) => state.addAgentMessage);
  const setAgentTyping = useDashboardStore((state) => state.setAgentTyping);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // 1. Crea el chat con el primer mensaje del usuario
    const chatId = createChat(message);

    // 2. Navega inmediatamente al chat
    router.push(`/dashboard/chat/${chatId}`);

    // 3. Llama al agente en segundo plano
    setAgentTyping(true);
    try {
      const response = await sendMessageToAgent({
        message,
        chatId,
        history: [],
      });
      addAgentMessage(chatId, response.content);
    } catch (error) {
      console.error("Error al contactar al agente:", error);
      addAgentMessage(
        chatId,
        "Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo."
      );
    }
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
