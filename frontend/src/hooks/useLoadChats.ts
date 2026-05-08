"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/src/store/auth.store";
import { useDashboardStore } from "@/src/store/dashboard.store";
import { apiGetChats } from "@/src/services/chat.service";

export function useLoadChats() {
  const token = useAuthStore((state) => state.token);
  const setChats = useDashboardStore((state) => state.setChats);

  useEffect(() => {
    // Solo corre cuando el token esté disponible
    if (!token) return;

    apiGetChats(token)
      .then((backendChats) => {
        const mapped = backendChats.map((c) => ({
          id: c.id.toString(),
          backendId: c.id,
          title: c.title,
          createdAt: new Date(c.created_at),
          updatedAt: new Date(c.updated_at),
          messages: [],
        }));
        setChats(mapped);
      })
      .catch(console.error);
  }, [token]); // ← se vuelve a ejecutar cada vez que el token cambia
}
