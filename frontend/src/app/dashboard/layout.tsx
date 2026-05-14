"use client";

import { useState } from "react";
import Sidebar from "@/src/components/dashboard/Sidebar";

import { createContext, useContext } from "react";

export const SidebarContext = createContext<{
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}>({ collapsed: false, setCollapsed: () => {} });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main
          className={`w-full min-h-screen transition-all duration-300 ease-in-out ${
            collapsed ? "ml-16" : "ml-52"
          }`}
        >
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
