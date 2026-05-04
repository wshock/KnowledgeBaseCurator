"use client";

import { useParams } from "next/navigation";
import { useDashboardStore } from "@/src/store/dashboard.store";
import { ChatInput } from "@/src/components/dashboard/chat/ChatInput";
import { sendMessageToAgent } from "@/src/services/agent.service";
import { useEffect, useRef } from "react";

export default function ChatPage() {
  const params = useParams();
  const id = params.id as string;

  const chat = useDashboardStore((state) =>
    state.chats.find((c) => c.id === id)
  );
  const updateChat = useDashboardStore((state) => state.updateChat);
  const addAgentMessage = useDashboardStore((state) => state.addAgentMessage);
  const setAgentTyping = useDashboardStore((state) => state.setAgentTyping);
  const isAgentTyping = useDashboardStore((state) => state.isAgentTyping);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages, isAgentTyping]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !chat || isAgentTyping) return;

    // 1. Agrega el mensaje del usuario al store
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: message,
      timestamp: new Date(),
    };

    updateChat(id, {
      messages: [...chat.messages, userMessage],
      updatedAt: new Date(),
    });

    // 2. Muestra indicador "escribiendo..."
    setAgentTyping(true);

    try {
      // 3. Llama al agente (simulado o real según agentService)
      const history = chat.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendMessageToAgent({
        message,
        chatId: id,
        history,
      });

      // 4. Agrega la respuesta al store
      addAgentMessage(id, response.content);
    } catch (error) {
      console.error("Error al contactar al agente:", error);
      addAgentMessage(
        id,
        "Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo."
      );
    }
  };

  if (!chat) {
    return <div className="p-4">Chat no encontrado</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-bold mb-6 text-gray-800">{chat.title}</h1>

        <div className="space-y-4 max-w-3xl mx-auto">
          {chat.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-950 text-white"
                    : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Indicador "escribiendo..." del agente */}
          {isAgentTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 mb-2">
        <ChatInput
          onSend={handleSendMessage}
          disabled={isAgentTyping}
          placeholder={
            isAgentTyping
              ? "El agente está respondiendo..."
              : "Pregunta a SchoolAI sobre plan de estudio..."
          }
        />
      </div>
    </div>
  );
}
