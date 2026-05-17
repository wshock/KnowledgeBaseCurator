"""
Definición de patrones de validación.
"""

# Patrones para lenguaje ofensivo
PROFANITY_PATTERNS = [
    r"\bmierda\b",
    r"\bputa\b",
    r"\bjoder\b",
    r"\bcoño\b",
    r"\bpolla\b",
    r"\bcabrón\b",
    r"\bzorra\b",
    r"\bpene\b",
    r"\bvagina\b",
    r"\bsexo\b",
    r"\bporno\b",
    r"\bfuck\b",
    r"\bshit\b",
    r"\bass\b",
    r"\bbitch\b",
    r"\bdick\b",
    r"\bpussy\b",
]

# Patrones para solicitudes peligrosas
DANGEROUS_REQUEST_PATTERNS = [
    r"\bhackear\s+(cuentas?|servidores?|wifi)\b",
    r"\bcrear\s+malware\b",
    r"\bfabricar\s+explosivos\b",
    r"\brobar\s+contraseñas\b",
]

# Patrones para intenciones de odio
HATEFUL_INTENT_PATTERNS = [
    r"\bodio\b",
    r"\binferior\b",
    r"\bsuperior\b",
    r"\braza\b",
    r"\betnia\b",
    r"\bdiscriminación\b",
    r"\bracista\b",
    r"\bnazi\b",
    r"\bfascista\b",
    r"\bterrorista\b",
]

# Contextos académicos seguros
SAFE_ACADEMIC_CONTEXTS = [
    r"\bexplica\b",
    r"\banaliza\b",
    r"\bhistoria\b",
    r"\bqué es\b",
    r"\bpor qué\b",
    r"\bdefinición\b",
    r"\bejemplo\b",
    r"\bcomparación\b",
    r"\banálisis\b",
]