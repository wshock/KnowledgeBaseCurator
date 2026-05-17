"use client";

import { useState } from "react";
import Sidebar from "@/src/components/dashboard/Sidebar";
import { createContext } from "react";

export const SidebarContext = createContext<{
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}>({ collapsed: false, setCollapsed: () => {} });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex min-h-screen overflow-hidden bg-[#f0f5ff]">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <main
          className={`
            flex-1 min-h-screen overflow-x-hidden
            pb-20 md:pb-0
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
