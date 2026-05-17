"""
Módulo para validación de outputs.
"""

from .regex_utils import normalize_text, contains_pattern
from .patterns import PROFANITY_PATTERNS, DANGEROUS_REQUEST_PATTERNS, HATEFUL_INTENT_PATTERNS
from .schemas import ValidationResult

def validate_output(model_output: str) -> ValidationResult:
    """
    Valida el output generado por el modelo.

    Args:
        model_output: Texto generado por el modelo.

    Returns:
        ValidationResult con el resultado de la validación.
    """
    normalized_output = normalize_text(model_output)

    if not normalized_output:
        return ValidationResult(
            is_valid=False,
            validated_text=model_output,
            error_message="La respuesta no puede estar vacía."
        )

    if len(normalized_output) > 10000:
        return ValidationResult(
            is_valid=False,
            validated_text=model_output,
            error_message="La respuesta es demasiado larga (máximo 10000 caracteres)."
        )

    if contains_pattern(normalized_output, PROFANITY_PATTERNS):
        return ValidationResult(
            is_valid=False,
            validated_text=model_output,
            error_message="La respuesta contiene lenguaje inapropiado."
        )

    if contains_pattern(normalized_output, DANGEROUS_REQUEST_PATTERNS):
        return ValidationResult(
            is_valid=False,
            validated_text=model_output,
            error_message="La respuesta contiene instrucciones peligrosas."
        )

    if contains_pattern(normalized_output, HATEFUL_INTENT_PATTERNS):
        return ValidationResult(
            is_valid=False,
            validated_text=model_output,
            error_message="La respuesta contiene contenido de odio."
        )

    return ValidationResult(
        is_valid=True,
        validated_text=normalized_output
    )