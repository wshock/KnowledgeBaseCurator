"use client";

import { useState } from "react";
import { useDashboardStore } from "@/src/store/dashboard.store";
import { useRouter } from "next/navigation";
import { FiSearch, FiMessageSquare } from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi2";

export default function HistorialPage() {
  const chats = useDashboardStore((state) => state.chats);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todo" | "chats">("todo");
  const router = useRouter();

  const filteredChats = chats
    .filter((chat) => chat.messages.length > 0)
    .filter((chat) =>
      chat.title.toLowerCase().includes(search.toLowerCase())
    );

  const totalChats = chats.filter((c) => c.messages.length > 0).length;
  const totalMessages = chats.reduce((acc, c) => acc + c.messages.length, 0);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="h-screen bg-[#f0f5ff] flex flex-col p-8 overflow-hidden">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0">

        {/* Título — fijo */}
        <div className="mb-6 shrink-0">
          <h1 className="text-2xl font-bold text-[#1a2b4a]">Historial</h1>
          <p className="text-sm text-gray-400 mt-1">Todos tus chats y conversaciones anteriores.</p>
        </div>

        <div className="flex gap-6 flex-1 min-h-0">

          {/* Columna principal */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">

            {/* Búsqueda + filtros — fijo */}
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Busca chats, temas o material..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
                />
              </div>
              <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden text-sm font-medium">
                {(["todo", "chats"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2.5 transition-colors capitalize ${
                      filter === f
                        ? "bg-[#1a2b4a] text-white"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {f === "todo" ? "Todo" : "Chats"}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista con scroll */}
            {filteredChats.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <FiMessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  {search ? "No se encontraron chats con ese nombre." : "Aún no tienes chats guardados."}
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {filteredChats.map((chat) => {
                  const lastMessage = chat.messages[chat.messages.length - 1];
                  const hasFile = false;

                  return (
                    <div
                      key={chat.id}
                      onClick={() => router.push(`/dashboard/chat/${chat.id}`)}
                      className="bg-white rounded-2xl border border-gray-100 px-5 py-4 cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all group overflow-hidden"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          hasFile ? "bg-red-50" : "bg-indigo-50"
                        }`}>
                          {hasFile
                            ? <HiOutlineDocumentText className="h-5 w-5 text-red-400" />
                            : <FiMessageSquare className="h-4 w-4 text-indigo-400" />
                          }
                        </div>

                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-[#1a2b4a] truncate group-hover:text-blue-700 transition-colors">
                              {chat.title}
                            </h3>
                            <span className="text-xs text-gray-400 shrink-0">
                              {formatDate(chat.updatedAt)}
                            </span>
                          </div>
                          {lastMessage && (
                            <p className="text-xs text-gray-400 truncate">
                              {lastMessage.content}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-medium bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">
                              #CHAT
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {chat.messages.length} mensaje{chat.messages.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card lateral — fijo */}
          <div className="w-60 shrink-0 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Resumen
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total chats</span>
                  <span className="text-sm font-bold text-[#1a2b4a]">{totalChats}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total mensajes</span>
                  <span className="text-sm font-bold text-[#1a2b4a]">{totalMessages}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1a2b4a] rounded-2xl p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-2">
                SchoolAI
              </p>
              <p className="text-sm font-semibold mb-1">Gestión del conocimiento</p>
              <p className="text-xs text-blue-200 leading-relaxed">
                Todos tus chats quedan guardados aquí para que puedas consultarlos cuando quieras.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
