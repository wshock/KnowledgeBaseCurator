"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { buildTourSteps } from "./tourSteps";

const TOUR_KEY = "schoolai_tour_completed";
const TOUR_STEP_KEY = "schoolai_tour_pending_step";

/** Devuelve true si el usuario ya completó el tour en este navegador. */
export function hasTourBeenSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(TOUR_KEY) === "true";
  } catch {
    return false;
  }
}

/** Marca el paso que la siguiente página debe reanudar tras una navegación. */
export function setPendingStep(step: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOUR_STEP_KEY, String(step));
  } catch {
    // ignore
  }
}

/** Lee el paso pendiente y lo elimina del storage. Retorna null si no hay. */
export function consumePendingStep(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TOUR_STEP_KEY);
    if (raw === null) return null;
    window.localStorage.removeItem(TOUR_STEP_KEY);
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

/** Marca el tour como visto y lo inicia desde el primer paso. */
export function startTour(router: AppRouterInstance, startStep?: number): void {
  if (typeof window === "undefined") return;

  const steps = buildTourSteps(router);

  const driverObj = driver({
    showProgress: true,
    allowClose: true,
    overlayClickBehavior: "close",
    nextBtnText: "Continuar",
    prevBtnText: "Anterior",
    doneBtnText: "Finalizar",
    popoverClass: "schoolai-tour-popover",
    onDestroyStarted: () => {
      try {
        window.localStorage.setItem(TOUR_KEY, "true");
      } catch {
        // ignore
      }
      try {
        driverObj.destroy();
      } catch {
        // ignore
      }
    },
    steps,
  });

  driverObj.drive(startStep);
}

/** Borra el flag de "ya visto" y vuelve a iniciar el tour desde el paso 0. */
export function resetTour(router: AppRouterInstance): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOUR_KEY);
    window.localStorage.removeItem(TOUR_STEP_KEY);
  } catch {
    // ignore
  }
  // Si no estamos en /dashboard, llevamos al usuario de vuelta al inicio
  // para que el tour pueda arrancar desde el paso 0 sin perderse elementos.
  if (!window.location.pathname.startsWith("/dashboard")) {
    router.push("/dashboard");
  }
  startTour(router, 0);
}
