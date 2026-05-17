"""
Módulo para validación de inputs.
"""

from .regex_utils import normalize_text, contains_pattern
from .patterns import PROFANITY_PATTERNS
from .contextual import is_academic_context, has_malicious_intent
from .schemas import ValidationResult

def validate_input(user_input: str) -> ValidationResult:
    """
    Valida el input del usuario.

    Args:
        user_input: Texto ingresado por el usuario.

    Returns:
        ValidationResult con el resultado de la validación.
    """
    normalized_input = normalize_text(user_input)

    if not normalized_input:
        return ValidationResult(
            is_valid=False,
            validated_text=user_input,
            error_message="El input no puede estar vacío."
        )

    if len(normalized_input) > 2000:
        return ValidationResult(
            is_valid=False,
            validated_text=user_input,
            error_message="El input es demasiado largo (máximo 2000 caracteres)."
        )

    if contains_pattern(normalized_input, PROFANITY_PATTERNS):
        return ValidationResult(
            is_valid=False,
            validated_text=user_input,
            error_message="El input contiene lenguaje inapropiado."
        )

    if has_malicious_intent(normalized_input) and not is_academic_context(normalized_input):
        return ValidationResult(
            is_valid=False,
            validated_text=user_input,
            error_message="El input contiene solicitudes que incumplen las políticas de seguridad."
        )

    return ValidationResult(
        is_valid=True,
        validated_text=normalized_input
    )