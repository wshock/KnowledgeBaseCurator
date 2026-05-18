"""
Módulo para validación contextual.
"""

from .regex_utils import contains_pattern
from .patterns import SAFE_ACADEMIC_CONTEXTS, DANGEROUS_REQUEST_PATTERNS

def is_academic_context(text: str) -> bool:
    """
    Verifica si el texto tiene un contexto académico seguro.

    Args:
        text: Texto a validar.

    Returns:
        True si el texto tiene un contexto académico seguro, False en caso contrario.
    """
    return contains_pattern(text, SAFE_ACADEMIC_CONTEXTS)

def has_malicious_intent(text: str) -> bool:
    """
    Verifica si el texto tiene intención maliciosa.

    Args:
        text: Texto a validar.

    Returns:
        True si el texto tiene intención maliciosa, False en caso contrario.
    """
    return contains_pattern(text, DANGEROUS_REQUEST_PATTERNS)