"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FiPaperclip, FiSend } from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { RiStackLine } from "react-icons/ri";
import { SourcesModal, SelectedSources } from "./SourcesModal";

interface ChatInputProps {
  onSend: (message: string, sources: SelectedSources) => void;
  placeholder?: string;
  disabled?: boolean;
  chatId: number;
  token: string;
}

interface AttachedFile {
  file: File;
  localId: string;
}

export function ChatInput({
  onSend,
  placeholder = "Pregunta a SchoolAI sobre plan de estudio...",
  disabled = false,
  chatId,
  token,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [activeSources, setActiveSources] = useState<SelectedSources>({ globalIds: [], localIds: [] });
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => { autoResize(); }, [message]);

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSend(message, activeSources);
    setMessage("");
    setAttachedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFilesAttach = useCallback((files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter((f) => f.type === "application/pdf");
    const newAttached = pdfs.map((file) => ({ file, localId: Date.now().toString() + Math.random() }));
    setAttachedFiles((prev) => [...prev, ...newAttached]);
    // Abre el modal en pestaña local para que el usuario vea el archivo adjunto
    setSourcesOpen(true);
  }, []);

  const removeAttached = (localId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.localId !== localId));
  };

  const totalSources = activeSources.globalIds.length + activeSources.localIds.length;

  return (
    <>
      <SourcesModal
        isOpen={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        chatId={chatId}
        activeSources={activeSources}
        onConfirm={setActiveSources}
        token={token}
      />

      <div className="w-full max-w-3xl mx-auto">

        {/* Archivos adjuntos pendientes */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-1">
            {attachedFiles.map((a) => (
              <div key={a.localId}
                className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 shadow-sm">
                <HiOutlineDocumentText className="h-3.5 w-3.5 text-red-400 shrink-0" />
                <span className="max-w-[140px] truncate">{a.file.name}</span>
                <button onClick={() => removeAttached(a.localId)}
                  className="text-gray-300 hover:text-gray-500 transition-colors ml-0.5">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Indicador de fuentes activas */}
        {totalSources > 0 && (
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <RiStackLine className="h-3 w-3 text-blue-500" />
            <span className="text-[11px] text-blue-600 font-medium">
              {totalSources} fuente{totalSources !== 1 ? "s" : ""} activa{totalSources !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setActiveSources({ globalIds: [], localIds: [] })}
              className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors ml-1"
            >
              Quitar
            </button>
          </div>
        )}

        {/* Input principal */}
        <div className="relative flex items-end gap-2 bg-white border border-gray-300 rounded-2xl p-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-950 focus-within:border-transparent">

          {/* Clip: adjuntar archivo local */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Adjuntar PDF a este chat"
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 shrink-0 self-end mb-0.5"
          >
            <FiPaperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFilesAttach(e.target.files)}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm min-h-[24px] max-h-[200px] overflow-y-auto self-end"
          />

          {/* Botón fuentes */}
          <button
            type="button"
            onClick={() => setSourcesOpen(true)}
            title="Seleccionar fuentes"
            className={`relative p-2 rounded-lg transition-colors shrink-0 self-end ${
              totalSources > 0
                ? "bg-blue-50 text-[#1a2b4a] hover:bg-blue-100"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            <RiStackLine className="h-4 w-4" />
            {totalSources > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#1a2b4a] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {totalSources}
              </span>
            )}
          </button>

          {/* Enviar */}
          <button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="p-2 rounded-lg bg-blue-950 text-white hover:bg-blue-900 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors shrink-0 self-end"
          >
            <FiSend className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
