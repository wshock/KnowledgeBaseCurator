"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/src/store/auth.store";
import Sidebar from "@/src/components/dashboard/Sidebar";
import { createContext } from "react";
import { useLoadChats } from "@/src/hooks/useLoadChats";
import {
  hasTourBeenSeen,
  startTour,
  consumePendingStep,
} from "@/src/tour/useTour";

export const SidebarContext = createContext<{
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}>({ collapsed: false, setCollapsed: () => {} });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const loadSession = useAuthStore((state) => state.loadSession);

  useLoadChats();

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  // Auto-inicio / reanudación del tour multi-página.
  // Prioridad: si hay un paso pendiente, reanuda desde ese índice
  // (esto sucede justo después de un onNextClick que navega a otra ruta).
  // Si no hay paso pendiente y el tour nunca se ha visto, arranca desde 0.
  useEffect(() => {
    if (!token) return;

    const pending = consumePendingStep();
    if (pending !== null) {
      // Reanudación: la página ya está renderizada pero los componentes
      // dinámicos pueden tardar un instante. 1200ms da holgura.
      const t = window.setTimeout(() => startTour(router, pending), 1200);
      return () => window.clearTimeout(t);
    }

    if (hasTourBeenSeen()) return;
    // Primer inicio: solo disparamos en /dashboard (raíz) para no
    // competir con la reanudación de pasos posteriores.
    if (pathname !== "/dashboard") return;
    const t = window.setTimeout(() => startTour(router, 0), 800);
    return () => window.clearTimeout(t);
  }, [token, pathname, router]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f5ff]">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    );
  }

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex min-h-screen overflow-hidden bg-[#f0f5ff]">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main
          className={`
            flex-1 min-h-screen overflow-x-hidden
            pb-24 md:pb-0
            transition-all duration-300 ease-in-out
            ${collapsed ? "md:ml-16" : "md:ml-52"}
          `}
        >
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}