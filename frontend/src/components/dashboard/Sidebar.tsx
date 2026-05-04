"use client";

import { useState } from "react";
import { RiGraduationCapLine } from "react-icons/ri";
import { FiClock, FiFile, FiSettings, FiHelpCircle, FiLogOut, FiMessageSquare } from "react-icons/fi";
import { AiOutlineFolderAdd } from "react-icons/ai";
import { HiOutlineDocumentDuplicate } from "react-icons/hi2";
import { IoAddOutline } from "react-icons/io5";
import Link from "next/link";
import { useDashboardStore } from "@/src/store/dashboard.store";
import { useAuthStore } from "@/src/store/auth.store";
import { usePathname, useRouter } from "next/navigation";
import { LogoutModal } from "./LogoutModal";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const chats = useDashboardStore((state) => state.chats);
  const logout = useAuthStore((state) => state.logout);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const filteredChats = chats.filter((chat) => chat.messages.length > 0);

  const navigation = [
    { name: "Historial", path: "/historial", icon: FiClock },
    { name: "Subir archivo", path: "/subir-archivo", icon: AiOutlineFolderAdd },
    { name: "Archivos", path: "/archivos", icon: HiOutlineDocumentDuplicate },
  ];

  const navigationBottom = [
    { name: "Configuración", path: "/configuracion", icon: FiSettings },
    { name: "Centro de ayuda", path: "/ayuda", icon: FiHelpCircle },
  ];

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    router.push("/");
  };

  return (
    <>
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
      />

      <div className="fixed left-0 top-0 h-screen w-52 bg-white border-r border-gray-100 flex flex-col shadow-sm">

        {/* LOGO */}
        <div className="px-5 py-5 flex items-center gap-2.5">
          <RiGraduationCapLine className="h-8 w-auto text-white p-2 rounded bg-blue-950 shrink-0" />
          <span className="text-base font-bold text-indigo-900 tracking-tight">SchoolAI</span>
        </div>

        {/* NUEVO CHAT */}
        <div className="px-4 mb-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center gap-2 bg-blue-950 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <IoAddOutline className="h-4 w-4 shrink-0" />
            Nuevo chat
          </button>
        </div>

        {/* NAV PRINCIPAL */}
        <nav className="px-3 space-y-0.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-900"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* CHATS RECIENTES */}
        <div className="flex-1 overflow-y-auto px-3 mt-5 min-h-0">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">
            Chats recientes
          </p>
          <div className="space-y-0.5">
            {filteredChats.length === 0 && (
              <p className="text-xs text-gray-300 px-3 py-1">Sin chats aún</p>
            )}
            {filteredChats.map((chat) => {
              const isActive = pathname === `/dashboard/chat/${chat.id}`;
              return (
                <Link
                  key={chat.id}
                  href={`/dashboard/chat/${chat.id}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-900"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                >
                  <FiFile className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{chat.title}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* BOTTOM */}
        <div className="px-3 pb-3 mt-2 border-t border-gray-100 pt-3 space-y-0.5">
          {navigationBottom.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-900"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <FiLogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}
