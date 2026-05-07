"use client";

import { useParams } from "next/navigation";
import { useDashboardStore } from "@/src/store/dashboard.store";
import { useAuthStore } from "@/src/store/auth.store";
import { ChatInput } from "@/src/components/dashboard/chat/ChatInput";
import { apiSendMessage, apiGetMessages } from "@/src/services/chat.service";
import { useEffect, useRef, useCallback } from "react";
import { RiGraduationCapLine, RiSparklingLine } from "react-icons/ri";

export default function ChatPage() {
  const params = useParams();
  const localId = params.id as string;

  const chat = useDashboardStore((state) => state.chats.find((c) => c.id === localId));
  const updateChat = useDashboardStore((state) => state.updateChat);
  const addAgentMessage = useDashboardStore((state) => state.addAgentMessage);
  const setAgentTyping = useDashboardStore((state) => state.setAgentTyping);
  const isAgentTyping = useDashboardStore((state) => state.isAgentTyping);
  const token = useAuthStore((state) => state.token);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Carga mensajes del backend si el chat no tiene mensajes aún
  useEffect(() => {
    if (!chat || !token || chat.messages.length > 0) return;
    apiGetMessages(token, chat.backendId).then((msgs) => {
      const mapped = msgs.map((m) => ({
        id: m.id.toString(),
        role: m.sender as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.timestamp),
      }));
      updateChat(localId, { messages: mapped });
    }).catch(console.error);
  }, [chat?.backendId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages, isAgentTyping]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !chat || isAgentTyping) return;

    // Agrega mensaje del usuario localmente
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: message,
      timestamp: new Date(),
    };
    updateChat(localId, {
      messages: [...chat.messages, userMessage],
      updatedAt: new Date(),
    });

    setAgentTyping(true);

    try {
      const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("authToken") : "");
      if (!currentToken) {
        addAgentMessage(localId, "Error: No se encontró un token válido. Inicia sesión de nuevo.");
        return;
      }
      
      // Envía al backend — incluye el agente
      const pair = await apiSendMessage(currentToken, chat.backendId, message);
      addAgentMessage(localId, pair.assistant_message.content);
    } catch {
      addAgentMessage(localId, "Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.");
    }
  }, [token, chat, isAgentTyping, updateChat, localId, setAgentTyping, addAgentMessage]);

  if (!chat) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f0f5ff]">
        <p className="text-gray-400 text-sm">Chat no encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f0f5ff]">

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-5 max-w-3xl mx-auto">
          {chat.messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-blue-950 flex items-center justify-center shrink-0 mb-0.5">
                  <RiGraduationCapLine className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div className={`max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#1a2b4a] text-white rounded-br-sm shadow-md"
                  : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isAgentTyping && (
            <div className="flex items-end gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-950 flex items-center justify-center shrink-0">
                <RiGraduationCapLine className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-950 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-blue-950 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-blue-950 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-6 pb-8">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isAgentTyping}
            placeholder={isAgentTyping ? "SchoolAI está respondiendo..." : "Pregunta a SchoolAI sobre plan de estudio..."}
          />
        </div>
      </div>
    </div>
  );
}
