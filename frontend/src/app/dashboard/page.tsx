"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/src/store/dashboard.store";
import { useAuthStore } from "@/src/store/auth.store";
import { ChatInput } from "@/src/components/dashboard/chat/ChatInput";
import { apiCreateChat, apiSendMessage } from "@/src/services/chat.service";
import {
  apiGetUserDocuments,
  apiUploadUserDocument,
  apiDeleteDocument,
  apiGetGlobalDocuments,
  apiUploadGlobalDocument,
  DocumentResponse,
  GlobalDocument,
} from "@/src/services/document.service";
import { useLoadChats } from "@/src/hooks/useLoadChats";
import {
  RiSparklingLine,
  RiGlobalLine,
  RiFileHistoryLine,
  RiChatSmile3Line,
  RiUploadCloudLine,
  RiDeleteBinLine,
  RiFilePdfLine,
} from "react-icons/ri";

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

  const [activeTab, setActiveTab] = useState<"docs" | "chats">("docs");
  const [globalDocs, setGlobalDocs] = useState<GlobalDocument[]>([]);
  const [userDocs, setUserDocs] = useState<DocumentResponse[]>([]);
  const [uploadingGlobal, setUploadingGlobal] = useState(false);
  const [uploadingUser, setUploadingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useLoadChats();

  useEffect(() => {
    const currentToken = useAuthStore.getState().token;
    if (!currentToken || initialLoadDone) return;

    apiGetGlobalDocuments(currentToken)
      .then(setGlobalDocs)
      .catch((err) => console.error("Error loading global docs:", err));

    apiGetUserDocuments(currentToken)
      .then(setUserDocs)
      .catch((err) => console.error("Error loading user docs:", err));

    setInitialLoadDone(true);
  }, [initialLoadDone]);

  const reloadDocuments = useCallback(async () => {
    const currentToken = useAuthStore.getState().token;
    if (!currentToken) return;
    try {
      const [globals, userDocsData] = await Promise.all([
        apiGetGlobalDocuments(currentToken),
        apiGetUserDocuments(currentToken),
      ]);
      setGlobalDocs(globals);
      setUserDocs(userDocsData);
    } catch (err) {
      console.error("Error loading documents:", err);
    }
  }, []);

  const handleUploadGlobal = async (file: File) => {
    const currentToken = useAuthStore.getState().token;
    if (!currentToken) return;
    setUploadingGlobal(true);
    setError(null);
    try {
      await apiUploadGlobalDocument(currentToken, file);
      await reloadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploadingGlobal(false);
    }
  };

  const handleUploadUser = async (file: File) => {
    const currentToken = useAuthStore.getState().token;
    if (!currentToken) return;
    setUploadingUser(true);
    setError(null);
    try {
      await apiUploadUserDocument(currentToken, file);
      await reloadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploadingUser(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    const currentToken = useAuthStore.getState().token;
    if (!currentToken) return;
    try {
      await apiDeleteDocument(currentToken, docId);
      await reloadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    try {
      const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("authToken") : "");
      if (!currentToken) {
        console.warn("No hay token disponible para enviar el mensaje");
        return;
      }

      const backendChat = await apiCreateChat(currentToken, message.slice(0, 40));
      const localId = addChatFromBackend(backendChat.id, backendChat.title, message);
      router.push(`/dashboard/chat/${localId}`);
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
    <div className="min-h-screen flex flex-col bg-[#f0f5ff] overflow-x-hidden">
      <div className="flex items-center justify-end px-8 py-4" />

      <div className="flex-1 px-4 md:px-8 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <RiSparklingLine className="h-5 w-5 text-blue-500" />
            <p className="text-sm font-medium text-blue-500" suppressHydrationWarning>{greeting}</p>
          </div>
          <h1 className="text-2xl font-bold text-[#1a2b4a] tracking-tight" suppressHydrationWarning>
            {firstName}, ¿en qué trabajamos hoy?
          </h1>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "docs"
                ? "bg-[#1a2b4a] text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <RiFileHistoryLine className="h-4 w-4" /> Documentos
          </button>
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "chats"
                ? "bg-[#1a2b4a] text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <RiChatSmile3Line className="h-4 w-4" /> Chats
          </button>
        </div>

        {activeTab === "docs" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Global Documents Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <RiGlobalLine className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#1a2b4a]">Fuentes Globales</h2>
                  <p className="text-xs text-gray-400">Base de conocimiento para el agente</p>
                </div>
              </div>

              <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors mb-4">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadGlobal(file);
                  }}
                  disabled={uploadingGlobal}
                />
                {uploadingGlobal ? (
                  <span className="text-xs text-blue-600">Subiendo...</span>
                ) : (
                  <>
                    <RiUploadCloudLine className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Subir PDF como fuente global</span>
                  </>
                )}
              </label>

              {globalDocs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No hay fuentes globales aún</p>
              ) : (
                <div className="space-y-2">
                  {globalDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <RiFilePdfLine className="h-4 w-4 text-red-400 shrink-0" />
                      <span className="text-xs text-gray-700 truncate flex-1">{doc.filename}</span>
                      <span className="text-[10px] text-gray-400">{doc.chunks_indexed} chunks</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Documents Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <RiFileHistoryLine className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#1a2b4a]">Mis Documentos</h2>
                  <p className="text-xs text-gray-400">Documentos personales subidos</p>
                </div>
              </div>

              <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors mb-4">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadUser(file);
                  }}
                  disabled={uploadingUser}
                />
                {uploadingUser ? (
                  <span className="text-xs text-blue-600">Subiendo...</span>
                ) : (
                  <>
                    <RiUploadCloudLine className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Subir PDF personal</span>
                  </>
                )}
              </label>

              {userDocs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No has subido documentos aún</p>
              ) : (
                <div className="space-y-2">
                  {userDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                      <RiFilePdfLine className="h-4 w-4 text-red-400 shrink-0" />
                      <span className="text-xs text-gray-700 truncate flex-1">{doc.filename}</span>
                      <span className="text-[10px] text-gray-400">{doc.chunks_indexed} chunks</span>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                        title="Eliminar"
                      >
                        <RiDeleteBinLine className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "chats" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <RiChatSmile3Line className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1a2b4a]">Chats Recientes</h2>
                <p className="text-xs text-gray-400">Selecciona un chat para continuar</p>
              </div>
            </div>

            <div className="mb-6 max-w-2xl">
              <ChatInput onSend={() => {}} chatId={0} token={token ?? ""} />
            </div>
          </div>
        )}

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg shadow-lg">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-medium">×</button>
          </div>
        )}

        {activeTab === "docs" && (
          <div className="mt-8 flex flex-col items-center">
            <p className="text-gray-400 text-sm mb-4">O inicia un nuevo chat</p>
            <div className="w-full max-w-2xl mb-8">
              <ChatInput onSend={handleSendMessage} chatId={0} token={token ?? ""} />
            </div>
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
        )}
      </div>
    </div>
  );
}