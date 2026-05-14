"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/src/store/auth.store";
import { useLoadChats } from "@/src/hooks/useLoadChats";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const loadSession = useAuthStore((state) => state.loadSession);

  useEffect(() => {
    loadSession();
  }, []);

  useLoadChats();

  return <>{children}</>;
}
