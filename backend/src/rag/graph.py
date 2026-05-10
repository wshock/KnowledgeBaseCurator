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



# ---------------------------------------------------------------------------
# Constantes de modo
# ---------------------------------------------------------------------------
MODE_QA = "qa"          # Respuesta a pregunta normal
MODE_CURATE = "curate"  # Análisis y curaduría de documento del usuario

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

 
# ---------------------------------------------------------------------------
# Helpers de recuperación
# ---------------------------------------------------------------------------

def _retrieve_by_type(question: str, doc_type: str, k: int) -> list[str]:
    
    """
    Recupera chunks de ChromaDB filtrando por doc_type.
 
    Args:
        question: Pregunta o tema a buscar.
        doc_type: "base_knowledge" o "user_upload".
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
                "filter": {"doc_type": doc_type},
            },
        )
        docs = retriever.invoke(question)
        return [doc.page_content for doc in docs]
    except Exception as e:
        # No interrumpimos el flujo; el nodo caller decide qué hacer.
        print(f"[retrieve] Advertencia al recuperar '{doc_type}': {e}")
        return []
    


# ---------------------------------------------------------------------------
# Nodo 1 — Recuperación separada
# ---------------------------------------------------------------------------
def retrieve(state: RAGState) -> dict:
    """
    Nodo 1 — Recuperación.
 
    Busca en ChromaDB por separado:
    - Chunks de libros base  → base_context
    - Chunks del usuario     → user_context
 
    El modo se decide aquí: si hay user_context → MODE_CURATE, si no → MODE_QA.
    """
    question = state["question"]
 
    base_chunks = _retrieve_by_type(question, "base_knowledge", settings.RETRIEVER_K)
    user_chunks = _retrieve_by_type(question, "user_upload", settings.RETRIEVER_K)
 
    mode = MODE_CURATE if user_chunks else MODE_QA
 
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
def _build_qa_prompt(question: str, base_context: list[str]) -> str:
    """Prompt estándar para responder una pregunta con base en los libros."""
    context_text = "\n\n---\n\n".join(base_context) if base_context else "Sin contexto disponible."
    return f"""Eres un asistente experto. Responde la pregunta basándote ÚNICAMENTE en el contexto proporcionado.
    Si la respuesta no se encuentra en el contexto, responde: "No encontré información suficiente en los documentos para responder esa pregunta."
 
    Contexto:
    {context_text}
 
    Pregunta: {question}
 
    Respuesta:"""
 
 
def _build_curate_prompt(
    question: str,
    base_context: list[str],
    user_context: list[str],
    suggestions: list[dict],
    analysis_error: Optional[str],
    ) -> str:
        """
        Prompt de curaduría que incluye el análisis previo del nodo analyze.
        Genera una respuesta estructurada con hallazgos y recomendaciones.
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
    
        return f"""Eres un curador académico experto. Un estudiante ha subido un documento al sistema.
    Ya se realizó un análisis automático de inconsistencias. Tu tarea es presentar los hallazgos
    de forma clara y profesional al curador del curso.
    
    Tema: {question}
    
    === ANÁLISIS AUTOMÁTICO DE INCONSISTENCIAS ===
    {suggestions_text}
    
    === CONTENIDO DE LIBROS BASE ===
    {base_text}
    
    === CONTENIDO DEL DOCUMENTO DEL USUARIO ===
    {user_text}
    
    Genera un reporte estructurado con:
    1. Resumen ejecutivo (2-3 oraciones sobre el documento del usuario)
    2. Hallazgos detallados (explica cada inconsistencia o sugerencia encontrada)
    3. Recomendación final (qué debe hacer el curador: aprobar, rechazar, solicitar revisión, etc.)
    
    Si no se detectaron problemas, indica que el documento es consistente con el material del curso.
    """


def generate(state: RAGState) -> dict:
    """
    Nodo 3 — Generación.
 
    Construye el prompt según el modo (qa o curate) y genera la respuesta final.
    En modo curate incluye el análisis de inconsistencias del nodo anterior.
    """
    try:
        if state["mode"] == MODE_CURATE:
            prompt = _build_curate_prompt(
                question=state["question"],
                base_context=state["base_context"],
                user_context=state["user_context"],
                suggestions=state.get("suggestions", []),
                analysis_error=state.get("analysis_error"),
            )
        else:
            prompt = _build_qa_prompt(
                question=state["question"],
                base_context=state["base_context"],
            )
 
        llm = ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0,
        )
 
        response = llm.invoke([HumanMessage(content=prompt)])
        return {"answer": response.content}
 
    except Exception as e:
        # Error crítico: el LLM no pudo generar respuesta.
        error_answer = (
            f"Error al generar la respuesta: {e}\n"
            "Por favor intenta nuevamente o contacta al administrador del sistema."
        )
        print(f"[generate] Error crítico: {e}")
        return {"answer": error_answer}
    

# ---------------------------------------------------------------------------
# Router: decide si se ejecuta analyze o no
# ---------------------------------------------------------------------------
def route_after_retrieve(state: RAGState) -> str:
    """
    Decide el siguiente nodo después de retrieve.
    Si hay documentos del usuario → analyze.
    Si no → generate directamente.
    """
    if state["mode"] == MODE_CURATE:
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
