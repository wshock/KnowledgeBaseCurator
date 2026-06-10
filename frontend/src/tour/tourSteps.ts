import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { DriveStep } from "driver.js";
import { setPendingStep } from "./useTour";

/**
 * Definición del tour multi-página de SchoolAI.
 *
 * Mapa de pasos por página (índices base 0):
 *
 *   /dashboard                  →  0, 1, 2, 3
 *   /dashboard/subir-archivo    →  4, 5
 *   /dashboard/historial        →  6
 *   /dashboard/examenes         →  7, 8, 9, 10, 11, 12, 13
 *   popover final sin elemento  →  14
 *
 * Los pasos 3, 5 y 6 son "pasos-puente" que, al hacer clic en Siguiente,
 * guardan el paso inicial de la siguiente página en localStorage y
 * navegan a la ruta correspondiente. El driver se destruye y el layout
 * de la nueva ruta detecta el paso pendiente y reanuda el tour.
 *
 * En lugar de exportar un array estático, exportamos una función que
 * recibe el router de Next.js y construye los pasos con los callbacks
 * de navegación ya enlazados. Esto es necesario porque el router es
 * un hook y no puede usarse a nivel de módulo.
 */
export function buildTourSteps(router: AppRouterInstance): DriveStep[] {
  // Helper para construir un onNextClick que navega a una nueva ruta
  // guardando el paso inicial de la siguiente página.
  const navigateTo =
    (path: string, nextStepIndex: number) =>
    (
      _element: Element | undefined,
      _step: DriveStep,
      opts: { driver: { destroy: () => void; moveNext: () => void } }
    ) => {
      // 1) Persistir el paso que la siguiente página debe reanudar
      setPendingStep(nextStepIndex);
      // 2) Destruir el overlay actual limpiamente
      try {
        opts.driver.destroy();
      } catch {
        // ignore
      }
      // 3) Navegar a la nueva ruta
      router.push(path);
    };

  return [
    // ====================================================
    // /dashboard — pasos 0..3
    // ====================================================
    {
      element: '[data-tour="greeting"]',
      popover: {
        title: "¡Hola, profesor!",
        description:
          "Esta es tu área de trabajo personalizada. Te saludamos según la hora del día.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="chat-input"]',
      popover: {
        title: "Chatea con SchoolAI",
        description:
          "Escribe aquí tus preguntas o instrucciones. SchoolAI responderá basándose en tus documentos.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="suggestions"]',
      popover: {
        title: "Sugerencias rápidas",
        description:
          "Si no sabes por dónde empezar, prueba una de estas sugerencias para descubrir las capacidades del agente.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="new-chat"]',
      popover: {
        title: "Nuevo chat",
        description:
          "Cuando quieras empezar una conversación nueva desde cero, haz clic aquí.",
        side: "bottom",
        align: "center",
        onNextClick: navigateTo("/dashboard/subir-archivo", 4),
      },
    },

    // ====================================================
    // /dashboard/subir-archivo — pasos 4..5
    // ====================================================
    {
      element: '[data-tour="upload-dropzone"]',
      popover: {
        title: "Sube tus documentos",
        description:
          "Arrastra aquí tus PDFs para que SchoolAI los indexe y los use como fuente de conocimiento.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="upload-formats"]',
      popover: {
        title: "Formatos aceptados",
        description:
          "Solo PDFs con texto seleccionable, máximo 50MB. Los PDFs escaneados (imágenes) aún no son compatibles.",
        side: "left",
        align: "center",
        onNextClick: navigateTo("/dashboard/historial", 6),
      },
    },

    // ====================================================
    // /dashboard/historial — paso 6
    // ====================================================
    {
      element: '[data-tour="history-list"]',
      popover: {
        title: "Tu historial",
        description:
          "Aquí se guardan todas tus conversaciones. Puedes buscarlas, retomarlas o eliminarlas cuando quieras.",
        side: "right",
        align: "center",
        onNextClick: navigateTo("/dashboard/examenes", 7),
      },
    },

    // ====================================================
    // /dashboard/examenes — pasos 7..13
    // NOTA: los pasos 9..13 son dinámicos: el panel derecho solo
    // aparece DESPUÉS de seleccionar un examen en la lista.
    // ====================================================
    {
      element: '[data-tour="exam-create-card"]',
      popover: {
        title: "Crea tu examen",
        description:
          "Escribe un título y una descripción opcional para identificar el examen. Luego haz clic en 'Crear examen' para registrarlo.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tour="exam-list"]',
      popover: {
        title: "Tus exámenes",
        description:
          "Aquí aparecen todos tus exámenes. Haz clic en uno para seleccionarlo y comenzar a configurarlo.",
        side: "right",
        align: "start",
      },
    },
    {
      // NOTA: dinámico — solo aparece tras seleccionar un examen
      element: '[data-tour="exam-key-upload"]',
      popover: {
        title: "Sube la clave base",
        description:
          "Este es el examen resuelto o la rúbrica que usará la IA como referencia para calificar. Selecciona el PDF con las respuestas correctas.",
        side: "bottom",
        align: "start",
      },
    },
    {
      // NOTA: dinámico — solo aparece tras seleccionar un examen
      element: '[data-tour="exam-student-name"]',
      popover: {
        title: "Nombre del estudiante",
        description:
          "Escribe el nombre del estudiante cuyo examen vas a calificar. Es opcional pero útil para identificar el resultado.",
        side: "bottom",
        align: "start",
      },
    },
    {
      // NOTA: dinámico — solo aparece tras seleccionar un examen
      element: '[data-tour="exam-submission-upload"]',
      popover: {
        title: "Sube el examen del estudiante",
        description:
          "Selecciona el PDF con las respuestas del estudiante. La IA lo comparará con la clave base.",
        side: "bottom",
        align: "start",
      },
    },
    {
      // NOTA: dinámico — solo aparece tras subir una submission
      element: '[data-tour="exam-grade-button"]',
      popover: {
        title: "Calificación con IA",
        description:
          "Al subir el examen del estudiante, la IA lo analiza automáticamente comparándolo con la clave base y genera una calificación detallada.",
        side: "top",
        align: "end",
      },
    },
    {
      // NOTA: dinámico — solo aparece tras seleccionar un examen
      element: '[data-tour="exam-results"]',
      popover: {
        title: "Resultados de calificación",
        description:
          "Aquí verás todos los exámenes calificados con el puntaje y retroalimentación generada por la IA para cada estudiante.",
        side: "top",
        align: "center",
      },
    },

    // ====================================================
    // Popover final flotante — paso 14
    // Sin elemento, centrado en pantalla con side="over"
    // ====================================================
    {
      popover: {
        title: "¡Listo, ya conoces SchoolAI!",
        description:
          "Puedes repetir este recorrido en cualquier momento desde Configuración o Centro de ayuda.",
        side: "over",
        align: "center",
      },
    },
  ];
}
