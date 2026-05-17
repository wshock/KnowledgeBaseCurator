"""Definicion del grafo RAG con LangGraph.
 
El pipeline tiene tres nodos principales:
1) retrieve : recupera contexto relevante desde ChromaDB, separando
              chunks de libros base (base_knowledge) y del usuario (user_upload).
2) analyze  : compara ambos contextos, detecta inconsistencias conceptuales
              y construye sugerencias académicas estructuradas.
              Solo se ejecuta cuando hay documentos del usuario en ChromaDB.
3) generate : construye el prompt final y genera la respuesta con Groq.
              Usa el análisis previo si está disponible.
 
Flujo QA (sin documentos del usuario):
    START → retrieve → generate → END
 
Flujo Curación (con documentos del usuario):
    START → retrieve → analyze → generate → END
"""

 
import json
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from db.chroma_client import get_vectorstore
from config import settings
from rag.guardrails import validate_input, validate_output



# ---------------------------------------------------------------------------
# Constantes de modo
# ---------------------------------------------------------------------------
MODE_CHAT = "chat"
MODE_QA = "qa"
MODE_CURATE = "curate"

# ---------------------------------------------------------------------------
# Estado del grafo
# Cada nodo recibe este estado y retorna un dict con los campos que modifica.
# ---------------------------------------------------------------------------
class CurationSuggestion(TypedDict):
    """Estructura de una sugerencia académica generada por el agente."""
    type: str            # "redundancy" | "conflict" | "complement" | "no_support"
    description: str     # Explicación en lenguaje natural
    action: str          # Acción recomendada al curador
    severity: str        # "low" | "medium" | "high"
    base_reference: str  # Fragmento del libro base relacionado (puede ser vacío)s
    
class RAGState(TypedDict):
    """Estado compartido entre nodos del grafo RAG."""
    question: str
    base_context: list[str]         # Chunks recuperados de libros base
    user_context: list[str]         # Chunks recuperados de documentos del usuario
    suggestions: list[dict]         # Lista de CurationSuggestion (solo en modo curate)
    analysis_error: Optional[str]   # Error ocurrido durante el análisis (si hubo)
    answer: str
    mode: str                       # MODE_QA o MODE_CURATE

def _build_intent_classifier_prompt(question: str) -> str:

    return f"""
    Eres un clasificador de intención para un sistema RAG académico.

    Debes clasificar el mensaje del usuario en UNA SOLA categoría:

    - chat
    → conversación casual, saludos, agradecimientos o charla general.

    - qa
    → preguntas sobre contenido académico, libros o documentos.
    → incluye preguntas sobre documentos del usuario.

    - curate
    → solicitudes de análisis, comparación, revisión crítica,
    detección de inconsistencias, evaluación o validación académica.

    IMPORTANTE:
    - Responde SOLO con una palabra:
    chat
    qa
    o
    curate

    Mensaje del usuario:
    {question}
    """


def detect_intent(question: str) -> str:
    """
    Detecta intención usando un LLM classifier.
    """

    try:

        llm = ChatGroq(
            model=settings.GROQ_CLASSIFIER_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0,
        )

        prompt = _build_intent_classifier_prompt(question)

        response = llm.invoke([
            HumanMessage(content=prompt)
        ])

        intent = (
            response.content
            .strip()
            .lower()
            .replace('"', "")
            .replace(".", "")
        )

        valid_modes = {
            MODE_CHAT,
            MODE_QA,
            MODE_CURATE,
        }

        # fallback de seguridad
        if intent not in valid_modes:
            return MODE_QA

        return intent

    except Exception as e:

        print(f"[intent-classifier] Error: {e}")

        # fallback seguro
        return MODE_QA
 
# ---------------------------------------------------------------------------
# Helpers de recuperación
# ---------------------------------------------------------------------------

def _retrieve_by_type(question: str, document_type: str, k: int) -> list[str]:
    
    """
    Recupera chunks de ChromaDB filtrando por document_type.
 
    Args:
        question: Pregunta o tema a buscar.
        document_type: "base_knowledge" o "user_upload".
        k: Número de chunks a recuperar.
 
    Returns:
        Lista de strings con el contenido de los chunks.
        Retorna lista vacía si ocurre cualquier error (ChromaDB no disponible,
        colección vacía, etc.).
    """
    try:
        vectorstore = get_vectorstore()
        retriever = vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={
                "k": k,
                "fetch_k": settings.RETRIEVER_FETCH_K,
                "lambda_mult": settings.RETRIEVER_MMR_LAMBDA,
                "filter": {"document_type": document_type},
            },
        )
        docs = retriever.invoke(question)
        return [doc.page_content for doc in docs]
    except Exception as e:
        # No interrumpimos el flujo; el nodo caller decide qué hacer.
        print(f"[retrieve] Advertencia al recuperar '{document_type}': {e}")
        return []
    


# ---------------------------------------------------------------------------
# Nodo 1 — Recuperación separada
# ---------------------------------------------------------------------------
def retrieve(state: RAGState) -> dict:
    """
    Nodo 1 — Recuperación.
    """

    question = state["question"]

    # Detectar intención REAL
    mode = detect_intent(question)

    # ---------------------------------------------------
    # CHAT → no hacer retrieval
    # ---------------------------------------------------
    if mode == MODE_CHAT:
        return {
            "base_context": [],
            "user_context": [],
            "mode": MODE_CHAT,
            "suggestions": [],
            "analysis_error": None,
        }

    # ---------------------------------------------------
    # QA o CURATE → sí hacer retrieval
    # ---------------------------------------------------
    base_chunks = _retrieve_by_type(
        question,
        "base_knowledge",
        settings.RETRIEVER_K,
    )

    user_chunks = _retrieve_by_type(
        question,
        "user_upload",
        settings.RETRIEVER_K,
    )

    return {
        "base_context": base_chunks,
        "user_context": user_chunks,
        "mode": mode,
        "suggestions": [],
        "analysis_error": None,
    }
    
# ---------------------------------------------------------------------------
# Nodo 2 — Análisis y detección de inconsistencias
# ---------------------------------------------------------------------------
def _build_analysis_prompt(question: str, base_context: list[str], user_context: list[str]) -> str:
    """
    Construye el prompt para que el LLM analice inconsistencias entre
    el material del usuario y los libros base.
 
    El LLM debe responder ÚNICAMENTE con un JSON válido siguiendo
    la estructura de CurationSuggestion para cada hallazgo.
    """
    base_text = "\n\n---\n\n".join(base_context) if base_context else "Sin contenido de libros base disponible."
    user_text = "\n\n---\n\n".join(user_context)
 
    return f"""Eres un curador académico experto. Tu tarea es analizar un documento subido por un estudiante
    y compararlo con el contenido oficial de los libros base del curso.
 
    Debes identificar:
    1. REDUNDANCIA: El documento repite contenido que ya existe en los libros base.
    2. CONFLICTO: El documento contradice o es inconsistente con los libros base (esto es lo más importante).
    3. COMPLEMENTO: El documento agrega información útil que no está en los libros base.
    4. SIN_RESPALDO: El documento contiene afirmaciones que no tienen respaldo en los libros base.
 
    Tema consultado: {question}
 
    === CONTENIDO DE LIBROS BASE ===
    {base_text}
 
    ===CONTENIDO DEL DOCUMENTO DEL USUARIO ===
    {user_text}
 
    Responde ÚNICAMENTE con un JSON válido con esta estructura exacta, sin texto adicional, sin markdown:
    {{
    "suggestions": [
        {{
        "type": "conflict|redundancy|complement|no_support",
        "description": "Explicación clara de qué encontraste",
        "action": "Acción concreta recomendada al curador (aprobar, rechazar, revisar, fusionar)",
        "severity": "low|medium|high",
        "base_reference": "Fragmento breve del libro base relacionado, o vacío si no aplica"
        }}
    ]
    }}
    
    Si no encuentras ningún problema ni sugerencia relevante, retorna {{"suggestions": []}}.
    """
def analyze(state: RAGState) -> dict:
    """
    Nodo 2 — Análisis de inconsistencias (solo en modo curate).
 
    Compara user_context con base_context usando el LLM para detectar:
    - Redundancias
    - Conflictos conceptuales
    - Contenido complementario
    - Afirmaciones sin respaldo
 
    Maneja errores de parsing JSON y errores del LLM sin interrumpir el flujo.
    """
    # Validación: si no hay contexto del usuario, no hay nada que analizar.
    if not state.get("user_context"):
        return {"suggestions": [], "analysis_error": None}
 
    # Validación: advertir si no hay libros base (el análisis será limitado).
    if not state.get("base_context"):
        print("[analyze] Advertencia: No hay contenido de libros base para comparar.")
 
    try:
        prompt = _build_analysis_prompt(
            question=state["question"],
            base_context=state["base_context"],
            user_context=state["user_context"],
        )
 
        llm = ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0,  # Determinismo total para análisis consistente
        )
 
        response = llm.invoke([HumanMessage(content=prompt)])
        raw_content = response.content.strip()
 
        # Limpiar posibles backticks de markdown que el LLM pueda agregar
        if raw_content.startswith("```"):
            lines = raw_content.split("\n")
            raw_content = "\n".join(lines[1:-1])
 
        parsed = json.loads(raw_content)
        suggestions = parsed.get("suggestions", [])
 
        # Validar estructura de cada sugerencia
        validated_suggestions = []
        for s in suggestions:
            if not isinstance(s, dict):
                continue
            validated_suggestions.append({
                "type": s.get("type", "no_support"),
                "description": s.get("description", "Sin descripción"),
                "action": s.get("action", "Revisar manualmente"),
                "severity": s.get("severity", "medium"),
                "base_reference": s.get("base_reference", ""),
            })
 
        return {"suggestions": validated_suggestions, "analysis_error": None}
 
    except json.JSONDecodeError as e:
        # El LLM no retornó JSON válido; registramos el error pero seguimos.
        error_msg = f"Error al parsear respuesta del análisis: {e}"
        print(f"[analyze] {error_msg}")
        return {
            "suggestions": [],
            "analysis_error": error_msg,
        }
    except Exception as e:
        # Error inesperado (LLM no disponible, timeout, etc.)
        error_msg = f"Error inesperado durante el análisis: {e}"
        print(f"[analyze] {error_msg}")
        return {
            "suggestions": [],
            "analysis_error": error_msg,
        }
        
# ---------------------------------------------------------------------------
# Nodo 3 — Generación de respuesta final
# ---------------------------------------------------------------------------
def _build_qa_prompt(
    question: str,
    base_context: list[str],
    user_context: list[str],
) -> str:

    base_text = (
        "\n\n---\n\n".join(base_context)
        if base_context
        else "Sin contenido base."
    )

    user_text = (
        "\n\n---\n\n".join(user_context)
        if user_context
        else "Sin documentos del usuario."
    )

    return f"""
Eres un asistente académico inteligente y útil.

Tu tarea es responder preguntas usando:

1. Los documentos del usuario como fuente principal.
2. Los libros base como referencia académica de apoyo.

Reglas IMPORTANTES:
- Responde de forma natural y útil.
- Prioriza la información del documento del usuario cuando la pregunta sea sobre su archivo.
- Usa los libros base para complementar, corregir o contextualizar.
- Si la pregunta es sobre contenido académico general (transistores, circuitos, etc.), 
  responde solo con los libros base e ignora el documento del usuario si no es relevante.
- Si la pregunta es directamente sobre el documento del usuario, entonces sí usa 
  ambas fuentes y puedes mencionar diferencias con los libros base.
- NO generes reportes de curaduría ni listas de inconsistencias a menos que el usuario lo solicite explícitamente.
- No inventes información.

=== LIBROS BASE ===
{base_text}

=== DOCUMENTOS DEL USUARIO ===
{user_text}

Pregunta:
{question}

Respuesta:
"""
 
 
def _build_curate_prompt(
    question: str,
    base_context: list[str],
    user_context: list[str],
    suggestions: list[dict],
    analysis_error: Optional[str],
    ) -> str:
        """
        Prompt de curaduría adaptativo:
        - Si el usuario pide mejoras o consejos → respuesta conversacional y directa.
        - Si el usuario pide análisis formal o reporte → respuesta estructurada completa.
        Sin markdown con asteriscos, usando texto plano y emojis para organizar.
        """
        base_text = "\n\n---\n\n".join(base_context) if base_context else "Sin contenido de libros base."
        user_text = "\n\n---\n\n".join(user_context)
    
        # Formatear sugerencias para el prompt
        if suggestions:
            suggestions_text = "\n".join([
                f"- [{s['type'].upper()} / severidad {s['severity']}] {s['description']} → Acción: {s['action']}"
                for s in suggestions
            ])
        elif analysis_error:
            suggestions_text = f"No se pudo completar el análisis automático: {analysis_error}"
        else:
            suggestions_text = "No se detectaron inconsistencias ni sugerencias relevantes."
    
        return f"""Eres un curador académico experto y amigable.

        El usuario hizo esta solicitud: "{question}"

        Analiza si es una solicitud CONVERSACIONAL (mejoras, consejos, qué le falta) o FORMAL (reporte, análisis completo, inconsistencias).

        Si es CONVERSACIONAL:
        - Responde de forma directa y natural, como si fuera una conversación.
        - Da sugerencias concretas y puntuales sin estructuras rígidas.
        - Usa un tono amigable y constructivo, Tambien puedes usar emojis para que se vea mas amigable.
        - No hagas un reporte completo, solo responde lo que preguntó.
        
        Si es FORMAL:
        - Organiza la respuesta en secciones claras usando emojis como separadores.
        - Ejemplo: "📋 Resumen", "🔍 Hallazgos", "✅ Recomendacion"
        - Sé detallado y profesional.
        REGLAS DE CONTENIDO (aplican siempre):
        - SIEMPRE usa los libros base como referencia para tus sugerencias.
        - Si el documento del usuario y los libros tienen temas en común, compáralos directamente
        señalando diferencias, gaps o contradicciones concretas.
        - Si el documento del usuario NO tiene relación directa con los libros, dilo claramente
        pero aun así indica qué temas de los libros debería considerar el usuario para
        enriquecer su documento, citando ejemplos concretos del contenido de los libros.
        - Nunca des sugerencias genéricas sin basarlas en el contenido real de los libros base

        REGLAS DE FORMATO (aplican siempre):
        - NO uses asteriscos para negrillas ni markdown (**texto**).
        - NO uses numeracion con puntos seguidos de texto en negrilla.
        - Usa texto plano, emojis para organizar si es necesario, y saltos de linea.
        - Escribe en español.

        === ANALISIS AUTOMATICO ===
        {suggestions_text}

        === LIBROS BASE ===
        {base_text}

        === DOCUMENTO DEL USUARIO ===
        {user_text}

        Respuesta:"""



def generate(state: RAGState) -> dict:
    """
    Nodo 3 — Generación final con guardrails.
    """

    try:
        # ---------------------------------------------------
        # Validar input con guardrails
        # ---------------------------------------------------
        is_input_valid, validated_question, input_error = validate_input(state["question"])
        
        if not is_input_valid:
            error_answer = f"Tu mensaje no pudo ser procesado: {input_error}"
            print(f"[guardrails] Input rechazado: {input_error}")
            return {"answer": error_answer}

        # ---------------------------------------------------
        # CHAT
        # ---------------------------------------------------
        if state["mode"] == MODE_CHAT:

            prompt = f"""
Eres un asistente conversacional amigable.

Responde naturalmente al usuario.

Mensaje:
{validated_question}
"""

        # ---------------------------------------------------
        # CURATE
        # ---------------------------------------------------
        elif state["mode"] == MODE_CURATE:

            prompt = _build_curate_prompt(
                question=validated_question,
                base_context=state["base_context"],
                user_context=state["user_context"],
                suggestions=state.get("suggestions", []),
                analysis_error=state.get("analysis_error"),
            )

        # ---------------------------------------------------
        # QA
        # ---------------------------------------------------
        else:

            prompt = _build_qa_prompt(
                question=validated_question,
                base_context=state["base_context"],
                user_context=state["user_context"],
            )

        llm = ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0,
        )

        response = llm.invoke([
            HumanMessage(content=prompt)
        ])

        # ---------------------------------------------------
        # Validar output con guardrails
        # ---------------------------------------------------
        is_output_valid, validated_answer, output_error = validate_output(response.content)
        
        if not is_output_valid:
            error_answer = f"La respuesta generada no pasó la validación: {output_error}\nPor favor reformula tu pregunta."
            print(f"[guardrails] Output rechazado: {output_error}")
            return {"answer": error_answer}

        return {"answer": validated_answer}

    except Exception as e:

        error_answer = (
            f"Error al generar la respuesta: {e}\n"
            "Por favor intenta nuevamente."
        )

        print(f"[generate] Error crítico: {e}")

        return {"answer": error_answer}
    

# ---------------------------------------------------------------------------
# Router: decide si se ejecuta analyze o no
# ---------------------------------------------------------------------------
def route_after_retrieve(state: RAGState) -> str:
    """
    Decide el siguiente nodo después de retrieve.
    """

    # Curaduría SOLO si hay documentos del usuario
    if (
        state["mode"] == MODE_CURATE
        and state.get("user_context")
    ):
        return "analyze"

    return "generate"
 


# ---------------------------------------------------------------------------
# Construcción del grafo
# Flujo QA:     START → retrieve → generate → END
# Flujo Curate: START → retrieve → analyze → generate → END
# ---------------------------------------------------------------------------
def build_rag_graph():
    """
    Crea y compila el grafo con routing condicional.
 
    El nodo retrieve determina el modo según si hay documentos del usuario
    en ChromaDB, y el router decide si pasar por analyze o ir directo a generate.
    """
    graph = StateGraph(RAGState)
 
    graph.add_node("retrieve", retrieve)
    graph.add_node("analyze", analyze)
    graph.add_node("generate", generate)
 
    graph.set_entry_point("retrieve")
 
    # Routing condicional después de retrieve
    graph.add_conditional_edges(
        "retrieve",
        route_after_retrieve,
        {
            "analyze": "analyze",
            "generate": "generate",
        },
    )
 
    graph.add_edge("analyze", "generate")
    graph.add_edge("generate", END)
 
    return graph.compile()


# Se compila una sola vez al importar el modulo para reducir overhead por request.
rag_chain = build_rag_graph()
