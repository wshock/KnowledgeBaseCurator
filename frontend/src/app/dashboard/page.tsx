"use client";

import Sidebar from "@/src/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar/>
      <main className="ml-64 w-full min-h-screen bg-white">
        {children}
      </main>
    </div>
  );
}