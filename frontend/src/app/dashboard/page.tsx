"use client";

import { useCallback } from "react";

import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/src/store/dashboard.store";
import { useAuthStore } from "@/src/store/auth.store";
import { ChatInput } from "@/src/components/dashboard/chat/ChatInput";
import { apiCreateChat, apiSendMessage } from "@/src/services/chat.service";
import { RiSparklingLine } from "react-icons/ri";

const SUGGESTIONS = [
  "Crea un plan de estudio para matemáticas",
  "Revisa mi taller de arquitectura",
  "Explícame la técnica Pomodoro",
  "Genera un resumen de mis apuntes",
];

export default function Dashboard() {
  const router = useRouter();
  const addChatFromBackend = useDashboardStore((state) => state.addChatFromBackend);
  const addAgentMessage = useDashboardStore((state) => state.addAgentMessage);
  const setAgentTyping = useDashboardStore((state) => state.setAgentTyping);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    try {
      const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("authToken") : "");
      if (!currentToken) {
        console.warn("No hay token disponible para enviar el mensaje");
        return;
      }

      // 1. Crea el chat en el backend
      const backendChat = await apiCreateChat(currentToken, message.slice(0, 40));
      // 2. Agrega al store con el backendId
      const localId = addChatFromBackend(backendChat.id, backendChat.title, message);
      // 3. Navega al chat inmediatamente
      router.push(`/dashboard/chat/${localId}`);
      // 4. Envía el mensaje al agente
      setAgentTyping(true);
      const pair = await apiSendMessage(currentToken, backendChat.id, message);
      addAgentMessage(localId, pair.assistant_message.content);
    } catch (err) {
      console.error("Error:", err);
    }
  }, [token, addChatFromBackend, router, setAgentTyping, addAgentMessage]);

  const firstName = user?.name?.split(" ")[0] ?? "Profesor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="h-screen flex flex-col bg-[#f0f5ff]">
      <div className="flex items-center justify-end px-8 py-4" />
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <div className="flex items-center gap-2 mb-2">
          <RiSparklingLine className="h-5 w-5 text-blue-500" />
          <p className="text-sm font-medium text-blue-500" suppressHydrationWarning>{greeting}</p>
        </div>
        <h1 className="text-3xl font-bold text-[#1a2b4a] mb-2 tracking-tight" suppressHydrationWarning>
          {firstName}, ¿en qué trabajamos hoy?
        </h1>
        <p className="text-gray-400 text-sm mb-10">
          Pregúntame sobre planes de estudio, talleres o cualquier tema académico.
        </p>
        <div className="w-full max-w-2xl mb-8">
          <ChatInput onSend={handleSendMessage} chatId={0} token={""} />
        </div>
        <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => handleSendMessage(s)}
              className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 px-4 py-2 rounded-full transition-colors">
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
