"use client";

import { useState } from "react";
import { useAuthStore } from "@/src/store/auth.store";
import { FiUser, FiMail, FiGlobe, FiMoon, FiSun, FiBell, FiShield, FiChevronRight } from "react-icons/fi";

export default function ConfiguracionPage() {
  const user = useAuthStore((state) => state.user);
  const [darkMode, setDarkMode] = useState(false);
  const [idioma, setIdioma] = useState("es");
  const [notificaciones, setNotificaciones] = useState(true);

  return (
    <div className="min-h-screen bg-[#f0f5ff] p-8">
      <div className="max-w-4xl mx-auto">

        {/* Título */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1a2b4a]">Configuración</h1>
          <p className="text-sm text-gray-400 mt-1">Administra tu perfil y preferencias.</p>
        </div>

        <div className="space-y-5">

          {/* PERFIL */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-[#1a2b4a] flex items-center gap-2">
                <FiUser className="h-4 w-4 text-blue-500" />
                Perfil
              </h2>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Avatar + nombre */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-950 flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user?.name ?? "Usuario"}</p>
                  <p className="text-xs text-gray-400">{user?.email ?? "—"}</p>
                </div>
                <button className="ml-auto text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors">
                  Editar perfil
                </button>
              </div>

              {/* Campos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Nombre completo</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                    <FiUser className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600">{user?.name ?? "—"}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Correo electrónico</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                    <FiMail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600 truncate">{user?.email ?? "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* APARIENCIA */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-[#1a2b4a] flex items-center gap-2">
                <FiSun className="h-4 w-4 text-blue-500" />
                Apariencia
              </h2>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Tema */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Tema oscuro</p>
                  <p className="text-xs text-gray-400">Próximamente disponible</p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  disabled
                  title="Próximamente"
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-not-allowed opacity-40 ${
                    darkMode ? "bg-blue-950" : "bg-gray-200"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? "translate-x-5" : ""}`} />
                </button>
              </div>

              {/* Modo claro/oscuro visual */}
              <div className="flex gap-3">
                <button className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-blue-500 bg-blue-50 transition-all">
                  <div className="w-full h-10 bg-white rounded-lg border border-gray-200 flex items-center px-2 gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <div className="flex-1 h-1.5 bg-gray-200 rounded" />
                  </div>
                  <span className="text-xs font-medium text-blue-700">Claro</span>
                </button>
                <button className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-gray-200 opacity-50 cursor-not-allowed transition-all" disabled>
                  <div className="w-full h-10 bg-gray-800 rounded-lg border border-gray-700 flex items-center px-2 gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-600" />
                    <div className="flex-1 h-1.5 bg-gray-700 rounded" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">Oscuro</span>
                </button>
              </div>
            </div>
          </section>

          {/* IDIOMA */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-[#1a2b4a] flex items-center gap-2">
                <FiGlobe className="h-4 w-4 text-blue-500" />
                Idioma y región
              </h2>
            </div>

            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Idioma de la interfaz</p>
                  <p className="text-xs text-gray-400">Selecciona el idioma de la app</p>
                </div>
                <select
                  value={idioma}
                  onChange={(e) => setIdioma(e.target.value)}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </section>

          {/* NOTIFICACIONES */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-[#1a2b4a] flex items-center gap-2">
                <FiBell className="h-4 w-4 text-blue-500" />
                Notificaciones
              </h2>
            </div>

            <div className="px-6 py-5 space-y-4">
              {[
                { label: "Notificaciones de respuesta", desc: "Cuando el agente responde tu pregunta", value: notificaciones, set: setNotificaciones },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => item.set(!item.value)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      item.value ? "bg-blue-950" : "bg-gray-200"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.value ? "translate-x-5" : ""}`} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* SEGURIDAD */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-[#1a2b4a] flex items-center gap-2">
                <FiShield className="h-4 w-4 text-blue-500" />
                Seguridad
              </h2>
            </div>

            <div className="divide-y divide-gray-50">
              {[
                { label: "Cambiar contraseña", desc: "Actualiza tu contraseña de acceso" },
              ].map((item, i) => (
                <button key={i} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group">
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <FiChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </button>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
