const MOCK_MODE = true; 
const AGENT_API_URL = "http://localhost:8000/api/v1/agent";

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
    await new Promise((res) =>
      setTimeout(res, 1000 + Math.random() * 1000)
    );

    const random = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
    return { content: random };
  }

  const response = await fetch(AGENT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

  return { content: data.content ?? data.message ?? data.response };
}
