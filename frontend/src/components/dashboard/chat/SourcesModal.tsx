"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FiX, FiUploadCloud, FiCheckCircle, FiLoader } from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { RiGlobalLine } from "react-icons/ri";
import { MdOutlineChat } from "react-icons/md";
import { apiGetGlobalDocuments, GlobalDocument } from "@/src/services/document.service";

export interface SelectedSources {
  globalIds: string[];
  localIds: number[];
}

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: number;
  activeSources: SelectedSources;
  onConfirm: (sources: SelectedSources) => void;
  token: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

type UploadStatus = "idle" | "uploading" | "success" | "error";
interface PendingUpload { file: File; status: UploadStatus; error?: string; docId?: number }

interface LocalDoc {
  id: number;
  filename: string;
  size_bytes: number;
  uploaded_at: string;
}

export function SourcesModal({ isOpen, onClose, chatId, activeSources, onConfirm, token }: SourcesModalProps) {
  const [tab, setTab] = useState<"global" | "local">("global");
  const [globalDocs, setGlobalDocs] = useState<GlobalDocument[]>([]);
  const [localDocs, setLocalDocs] = useState<LocalDoc[]>([]);
  const [selectedGlobal, setSelectedGlobal] = useState<Set<string>>(new Set());
  const [selectedLocal, setSelectedLocal] = useState<Set<number>>(new Set());
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadGlobalDocs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const docs = await apiGetGlobalDocuments(token);
      setGlobalDocs(docs);
    } catch (err) {
      console.error("Error loading global docs:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedGlobal(new Set(activeSources.globalIds));
    setSelectedLocal(new Set(activeSources.localIds));
    setPendingUploads([]);
    loadGlobalDocs();
  }, [isOpen, chatId, activeSources, loadGlobalDocs]);

  const toggleGlobal = (id: string) => setSelectedGlobal((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleLocal  = (id: number) => setSelectedLocal((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleLocalUpload = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setPendingUploads((prev) => [...prev, { file, status: "error", error: "Solo se aceptan PDFs" }]);
      return;
    }
    setPendingUploads((prev) => [...prev, { file, status: "uploading" }]);
    await new Promise((r) => setTimeout(r, 1200));
    const mockId = Date.now();
    const mockDoc: LocalDoc = { id: mockId, filename: file.name, size_bytes: file.size, uploaded_at: new Date().toISOString() };
    setLocalDocs((prev) => [...prev, mockDoc]);
    setSelectedLocal((prev) => new Set([...prev, mockId]));
    setPendingUploads((prev) => prev.map((p) => p.file === file ? { ...p, status: "success", docId: mockId } : p));
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(handleLocalUpload);
    setTab("local");
  }, [handleLocalUpload]);

  const handleConfirm = () => { onConfirm({ globalIds: Array.from(selectedGlobal), localIds: Array.from(selectedLocal) }); onClose(); };
  const totalSelected = selectedGlobal.size + selectedLocal.size;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-lg flex flex-col overflow-hidden
        rounded-t-2xl sm:rounded-2xl shadow-2xl
        max-h-[90vh] sm:max-h-[80vh]">

        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-[#1a2b4a]">Fuentes del chat</h2>
            <p className="text-xs text-gray-400 mt-0.5">Selecciona los archivos que SchoolAI usará como contexto</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-4 md:px-6">
          {([["global", RiGlobalLine, "Archivos globales", selectedGlobal], ["local", MdOutlineChat, "Este chat", selectedLocal]] as const).map(([key, Icon, label, set]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 text-xs font-semibold py-3 border-b-2 mr-5 transition-colors ${tab === key ? "border-[#1a2b4a] text-[#1a2b4a]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              <Icon className="h-3.5 w-3.5" />{label}
              {set.size > 0 && <span className="ml-1 bg-[#1a2b4a] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{set.size}</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === "global" && (
            <div className="p-4 space-y-2">
              {loading && (
                <div className="text-center py-10">
                  <FiLoader className="h-6 w-6 text-gray-300 mx-auto mb-2 animate-spin" />
                  <p className="text-xs text-gray-400">Cargando documentos...</p>
                </div>
              )}
              {!loading && globalDocs.length === 0 && (
                <div className="text-center py-10">
                  <RiGlobalLine className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No hay archivos globales aún.</p>
                </div>
              )}
              {!loading && globalDocs.map((doc) => {
                const isSelected = selectedGlobal.has(doc.id);
                return (
                  <button key={doc.id} onClick={() => toggleGlobal(doc.id)}
                    className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl border transition-all text-left ${isSelected ? "border-[#1a2b4a] bg-[#f0f5ff]" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-[#1a2b4a]" : "bg-red-50"}`}>
                      <HiOutlineDocumentText className={`h-4 w-4 ${isSelected ? "text-white" : "text-red-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{doc.filename}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{doc.chunks_indexed} fragmentos</p>
                    </div>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "border-[#1a2b4a] bg-[#1a2b4a]" : "border-gray-300"}`}>
                      {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {tab === "local" && (
            <div className="p-4 space-y-3">
              <div
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed p-5 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/40"}`}
              >
                <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                <FiUploadCloud className="h-6 w-6 text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-500">Arrastra un PDF o haz clic</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Solo para este chat · Max 50MB</p>
              </div>
              {pendingUploads.map((u, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><HiOutlineDocumentText className="h-4 w-4 text-red-400" /></div>
                  <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-700 truncate">{u.file.name}</p><p className="text-[10px] text-gray-400">{formatSize(u.file.size)}</p></div>
                  {u.status === "uploading" && <span className="flex items-center gap-1 text-[10px] text-blue-500 font-medium shrink-0"><FiLoader className="h-3 w-3 animate-spin" />Subiendo...</span>}
                  {u.status === "success"   && <FiCheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                  {u.status === "error"     && <span className="text-[10px] text-red-500 font-medium shrink-0">{u.error}</span>}
                </div>
              ))}
              {localDocs.length === 0 && pendingUploads.length === 0 && <p className="text-center text-xs text-gray-400 py-4">Aún no hay archivos en este chat</p>}
              {localDocs.map((doc) => {
                const isSelected = selectedLocal.has(doc.id);
                return (
                  <button key={doc.id} onClick={() => toggleLocal(doc.id)}
                    className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl border transition-all text-left ${isSelected ? "border-[#1a2b4a] bg-[#f0f5ff]" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-[#1a2b4a]" : "bg-red-50"}`}><HiOutlineDocumentText className={`h-4 w-4 ${isSelected ? "text-white" : "text-red-400"}`} /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-700 truncate">{doc.filename}</p><p className="text-[10px] text-gray-400 mt-0.5">{formatSize(doc.size_bytes)} · {formatDate(doc.uploaded_at)}</p></div>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "border-[#1a2b4a] bg-[#1a2b4a]" : "border-gray-300"}`}>
                      {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {totalSelected === 0 ? "Sin fuentes seleccionadas" : `${totalSelected} fuente${totalSelected !== 1 ? "s" : ""} seleccionada${totalSelected !== 1 ? "s" : ""}`}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 md:px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button onClick={handleConfirm} className="px-3 md:px-4 py-2 text-xs font-semibold text-white bg-[#1a2b4a] hover:bg-blue-900 rounded-lg transition-colors">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
}