"""Módulo de guardrails para validación de input y output.

Usa validación manual con regex para asegurar que:
- Los inputs no contengan contenido obsceno o irrelevante
- Los outputs no contengan contenido inapropiado o peligroso
"""

import re
from typing import Tuple


# Listas de palabras prohibidas (pueden expandirse)
PROFANITY_WORDS = [
    'mierda', 'puta', 'joder', 'coño', 'polla', 'cabrón', 'zorra', 
    'pene', 'vagina', 'sexo', 'porno', 'fuck', 'shit', 'ass', 
    'bitch', 'dick', 'pussy'
]

ILLEGAL_PHRASES = [
    'cómo hackear', 'cómo fabricar', 'cómo hacer', 'receta para',
    'instrucciones para', 'paso a paso para', 'cómo crear', 'cómo producir'
]

HATE_SPEECH_WORDS = [
    'odio', 'inferior', 'superior', 'raza', 'etnia', 'discriminación',
    'racista', 'nazi', 'fascista', 'terrorista'
]

ACADEMIC_KEYWORDS = [
    'explica', 'qué es', 'cómo', 'por qué', 'definición', 'ejemplo',
    'diferencia', 'comparación', 'análisis', 'calcular', 'fórmula',
    'teoría', 'concepto', 'principio', 'método', 'técnica', 'problema',
    'solución', 'duda', 'pregunta', 'ayuda', 'información', 'aprender',
    'entender', 'comprender', 'estudiar'
]


def validate_input(user_input: str) -> Tuple[bool, str, str]:
    """
    Valida el input del usuario usando validación manual.

    Args:
        user_input: Pregunta o mensaje del usuario.

    Returns:
        tuple (is_valid, validated_input, error_message):
        - is_valid: True si el input pasa la validación
        - validated_input: Input validado y limpio (o original si falla)
        - error_message: Mensaje de error si falla la validación
    """
    # Verificar que no esté vacío
    if not user_input or not user_input.strip():
        return False, user_input, "El input no puede estar vacío"

    # Verificar longitud máxima
    if len(user_input) > 2000:
        return False, user_input, "El input es demasiado largo (máximo 2000 caracteres)"

    # Verificar que no contenga lenguaje obsceno
    lower_input = user_input.lower()
    if any(word in lower_input for word in PROFANITY_WORDS):
        return False, user_input, "El input contiene lenguaje inapropiado"

    # Verificar que sea relevante al propósito académico
    # Si tiene al menos 3 palabras o contiene palabras académicas
    word_count = len(user_input.split())
    has_academic_keyword = any(keyword in lower_input for keyword in ACADEMIC_KEYWORDS)
    
    if word_count < 3 and not has_academic_keyword:
        return False, user_input, "El input no parece ser una pregunta académica relevante"

    return True, user_input.strip(), ""


def validate_output(model_output: str) -> Tuple[bool, str, str]:
    """
    Valida el output del modelo usando validación manual.

    Args:
        model_output: Respuesta generada por el modelo.

    Returns:
        tuple (is_valid, validated_output, error_message):
        - is_valid: True si el output pasa la validación
        - validated_output: Output validado y limpio (o original si falla)
        - error_message: Mensaje de error si falla la validación
    """
    # Verificar que no esté vacío
    if not model_output or not model_output.strip():
        return False, model_output, "La respuesta no puede estar vacía"

    # Verificar longitud máxima
    if len(model_output) > 10000:
        return False, model_output, "La respuesta es demasiado larga (máximo 10000 caracteres)"

    # Verificar que no contenga lenguaje obsceno
    lower_output = model_output.lower()
    if any(word in lower_output for word in PROFANITY_WORDS):
        return False, model_output, "La respuesta contiene lenguaje inapropiado"

    # Verificar que no contenga instrucciones para actividades ilegales
    if any(phrase in lower_output for phrase in ILLEGAL_PHRASES):
        return False, model_output, "La respuesta parece contener instrucciones potencialmente peligrosas"

    # Verificar que no contenga contenido de odio
    if any(word in lower_output for word in HATE_SPEECH_WORDS):
        return False, model_output, "La respuesta contiene contenido de odio"

    # Verificar que sea una respuesta coherente (no solo repetir la pregunta)
    if len(model_output.split()) < 10:
        return False, model_output, "La respuesta es demasiado corta o incoherente"

    return True, model_output.strip(), ""
