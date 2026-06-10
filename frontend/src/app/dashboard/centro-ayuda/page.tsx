"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiUploadCloud, FiMessageSquare, FiBookOpen, FiChevronDown, FiChevronUp, FiArrowRight } from "react-icons/fi";
import { RiSparklingLine, RiCompassLine, RiQuestionMark, RiQuestionnaireLine  } from "react-icons/ri";
import { resetTour } from "@/src/tour/useTour";
import { useAuthStore } from "@/src/store/auth.store";

const FAQS = [
  { q: "¿Qué tipos de documentos puedo subir?", a: "Actualmente SchoolAI acepta archivos PDF con texto seleccionable. Los PDFs escaneados (imágenes) no son compatibles por el momento." },
  { q: "¿El agente responde solo con base en mis documentos?", a: "Sí. El agente usa únicamente el contenido de los documentos que hayas subido. Si no encuentra información relevante, te lo indicará directamente." },
  { q: "¿Puedo subir varios documentos?", a: "Sí, puedes subir múltiples PDFs. El agente buscará en todos ellos al responder tus preguntas." },
  { q: "¿Mis documentos son privados?", a: "Sí, los documentos se indexan en tu base de conocimiento personal y no son accesibles por otros usuarios." },
  { q: "¿Qué hago si el agente no encuentra la respuesta?", a: "Verifica que el PDF no sea escaneado y que el tema de tu pregunta esté cubierto en el documento. Intenta reformular la pregunta con términos más específicos del documento." },
  { q: "¿Puedo eliminar documentos subidos?", a: "Esta función estará disponible próximamente en la sección de Archivos." },
];

const SECTIONS = [
  { icon: FiUploadCloud, color: "bg-indigo-50 text-indigo-500", title: "Subir documentos", description: "Cómo preparar e indexar tus archivos para que el agente los consulte.", steps: ["Ve a Subir archivo en el menú lateral.", "Arrastra un PDF o haz click en Seleccionar archivo.", "Espera a que el estado cambie a ✓ y muestre el número de fragmentos indexados.", "¡Listo! El agente ya puede consultar ese documento al responder."] },
  { icon: FiMessageSquare, color: "bg-blue-50 text-blue-500", title: "Hacer preguntas", description: "Cómo sacar el mayor provecho al chat con el agente.", steps: ["Haz click en Nuevo chat o escribe directamente en el input principal.", "Escribe tu pregunta con términos presentes en tus documentos.", "El agente buscará los fragmentos más relevantes y generará una respuesta.", "Puedes hacer preguntas de seguimiento en el mismo chat."] },
  { icon: FiBookOpen, color: "bg-emerald-50 text-emerald-500", title: "Gestionar el historial", description: "Cómo navegar y organizar tus conversaciones anteriores.", steps: ["Ve a Historial en el menú lateral para ver todos tus chats.", "Usa el buscador para encontrar una conversación por nombre.", "Haz click en cualquier chat para retomar la conversación.", "Desde el sidebar puedes renombrar o eliminar chats con los 3 puntos (⋯)."] },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 md:px-6 py-4 text-left hover:bg-gray-50 transition-colors">
        <span className="text-sm font-medium text-gray-700 pr-4">{q}</span>
        {open ? <FiChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <FiChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 md:px-6 pb-4">
          <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function CentroAyudaPage() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-[#f0f5ff] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">

        <div className="bg-[#1a2b4a] rounded-2xl p-5 md:p-8 mb-6 md:mb-8 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <RiQuestionnaireLine className="h-4 w-4 md:h-5 md:w-5 text-blue-300" />
              <span className="text-xs font-semibold text-blue-300 uppercase tracking-widest">Centro de ayuda</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">¿Cómo podemos ayudarte?</h1>
            <p className="text-blue-200 text-xs md:text-sm leading-relaxed max-w-md">
              Aprende a sacar el máximo provecho de SchoolAI — sube documentos, haz preguntas y gestiona tu conocimiento académico.
            </p>
          </div>
          <div className="hidden md:flex w-20 h-20 rounded-2xl bg-white/10 items-center justify-center shrink-0">
            <RiQuestionMark className="h-10 w-10 text-white" />
          </div>
        </div>

        <div className="mb-6 md:mb-8">
          <h2 className="text-base font-bold text-[#1a2b4a] mb-3 md:mb-4">Guías de uso</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 flex flex-col">
                  <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-3 md:mb-4 ${section.color}`}>
                    <Icon className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1a2b4a] mb-1">{section.title}</h3>
                  <p className="text-xs text-gray-400 mb-3 md:mb-4 leading-relaxed">{section.description}</p>
                  <ol className="space-y-2 flex-1">
                    {section.steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-xs text-gray-600">
                        <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 mb-6 md:mb-8">
          <h2 className="text-base font-bold text-[#1a2b4a] mb-1">¿Cómo funciona el agente?</h2>
          <p className="text-xs text-gray-400 mb-4 md:mb-6">El agente usa tecnología RAG (Retrieval-Augmented Generation)</p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 md:flex-wrap">
            {[
              { step: "1", label: "Subes un PDF", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
              null,
              { step: "2", label: "Se divide en fragmentos", color: "bg-blue-50 text-blue-700 border-blue-100" },
              null,
              { step: "3", label: "Se indexa en ChromaDB", color: "bg-purple-50 text-purple-700 border-purple-100" },
              null,
              { step: "4", label: "El agente busca y responde", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
            ].map((item, i) =>
              item ? (
                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold shrink-0 ${item.color}`}>
                  <span className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center font-bold text-[10px]">{item.step}</span>
                  {item.label}
                </div>
              ) : (
                <FiArrowRight key={i} className="h-4 w-4 text-gray-300 shrink-0" />
              )
            )}
          </div>
          <p className="text-xs text-gray-400 mt-4 md:mt-5 leading-relaxed">
            Cuando haces una pregunta, el agente busca los fragmentos más relevantes de tus documentos y genera una respuesta basada <strong className="text-gray-600">únicamente</strong> en ese contenido.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-[#1a2b4a]">Preguntas frecuentes</h2>
          </div>
          {FAQS.map((faq, i) => <FAQ key={i} q={faq.q} a={faq.a} />)}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-5 p-4 md:p-6 text-center">
          <h2 className="text-sm font-bold text-[#1a2b4a] mb-1">¿Primera vez en SchoolAI?</h2>
          <p className="text-xs text-gray-400 mb-4">Repite el recorrido guiado para recordar las funciones principales.</p>
          <button
            type="button"
            onClick={() => user && resetTour(router, user.id)}
            className="inline-flex items-center gap-2 bg-blue-950 hover:bg-blue-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <RiCompassLine className="h-6 w-6" />
            Ver tutorial de nuevo
          </button>
        </div>

      </div>
    </div>
  );
}
