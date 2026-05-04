"use client";

import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/src/store/dashboard.store";
import { ChatInput } from "@/src/components/dashboard/chat/ChatInput";
import { sendMessageToAgent } from "@/src/services/agent.service";
import { useAuthStore } from "@/src/store/auth.store";
import { RiSparklingLine } from "react-icons/ri";

const SUGGESTIONS = [
  "Crea un plan de estudio para matemáticas",
  "Revisa mi taller de arquitectura",
  "Explícame la técnica Pomodoro",
  "Genera un resumen de mis apuntes",
];

export default function Dashboard() {
  const router = useRouter();
  const createChat = useDashboardStore((state) => state.createChat);
  const addAgentMessage = useDashboardStore((state) => state.addAgentMessage);
  const setAgentTyping = useDashboardStore((state) => state.setAgentTyping);
  const user = useAuthStore((state) => state.user);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    const chatId = createChat(message);
    router.push(`/dashboard/chat/${chatId}`);
    setAgentTyping(true);
    try {
      const response = await sendMessageToAgent({ message, chatId, history: [] });
      addAgentMessage(chatId, response.content);
    } catch {
      addAgentMessage(chatId, "Lo siento, hubo un error. Intenta de nuevo.");
    }
  };

  const firstName = user?.name?.split(" ")[0] ?? "Profesor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="h-screen flex flex-col bg-[#f0f5ff]">
      {/* Header superior sutil */}
      <div className="flex items-center justify-end px-8 py-4">
        <div className="flex items-center gap-3">
          {/*<div className="w-8 h-8 rounded-full bg-blue-950 flex items-center justify-center text-white text-sm font-bold">
            {firstName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-gray-600">{user?.name ?? "Profesor"}</span>*/}
        </div>
      </div>

      {/* Contenido centrado */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">

        {/* Saludo */}
        <h1 className="text-3xl font-bold text-[#1a2b4a] mb-2 tracking-tight">
          {firstName}, ¿en qué trabajamos hoy?
        </h1>
        <p className="text-gray-400 text-sm mb-10">
          Pregúntame sobre planes de estudio, talleres o cualquier tema académico.
        </p>

        {/* Input */}
        <div className="w-full max-w-2xl mb-8">
          <ChatInput onSend={handleSendMessage} />
        </div>

        {/* Sugerencias */}
        <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSendMessage(s)}
              className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 px-4 py-2 rounded-full transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
