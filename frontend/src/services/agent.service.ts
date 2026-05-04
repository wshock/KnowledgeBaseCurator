/**
 * agentService.ts
 *
 * Aquí vive toda la lógica de comunicación con el agente de IA.
 *
 * HOY: usa simulación (MOCK_MODE = true)
 * MAÑANA: cambia MOCK_MODE a false y pon la URL real de tu backend
 */

const MOCK_MODE = true; // ← Cambia a false cuando conectes el backend
const AGENT_API_URL = "https://tu-backend.com/api/agent"; // ← Tu endpoint real

const MOCK_RESPONSES = [
  "¡Claro! Puedo ayudarte a crear un plan de estudio personalizado. ¿Qué materia o tema te gustaría trabajar?",
  "Basándome en tu consulta, te recomiendo dividir el estudio en bloques de 25 minutos con descansos de 5 minutos (técnica Pomodoro). ¿Te gustaría que diseñe un horario específico?",
  "Excelente pregunta. Para dominar este tema te sugiero empezar por los fundamentos y avanzar gradualmente hacia los conceptos más complejos.",
  "Entiendo tu duda. Te explico paso a paso: primero debes comprender la teoría base, luego practicar con ejercicios sencillos y finalmente resolver casos más complejos.",
  "He analizado tu consulta. Un plan de estudio efectivo para esto debería incluir: lectura activa, mapas mentales, ejercicios prácticos y revisión espaciada.",
];

export interface AgentRequest {
  message: string;
  chatId: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

export interface AgentResponse {
  content: string;
}

export async function sendMessageToAgent(
  request: AgentRequest
): Promise<AgentResponse> {
  if (MOCK_MODE) {
    // Simula delay de red (entre 1 y 2 segundos)
    await new Promise((res) =>
      setTimeout(res, 1000 + Math.random() * 1000)
    );

    const random = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
    return { content: random };
  }

  // ─── PRODUCCIÓN: reemplaza esto con tu lógica real ───────────────────────
  const response = await fetch(AGENT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`, // si tu backend requiere auth
    },
    body: JSON.stringify({
      message: request.message,
      chatId: request.chatId,
      history: request.history ?? [],
    }),
  });

  if (!response.ok) {
    throw new Error(`Error del agente: ${response.status}`);
  }

  const data = await response.json();

  // Ajusta esto según la forma exacta que devuelva tu backend:
  return { content: data.content ?? data.message ?? data.response };
  // ─────────────────────────────────────────────────────────────────────────
}
