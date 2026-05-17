"""
Esquemas de validación usando Pydantic.
"""

from pydantic import BaseModel
from typing import Optional

class ValidationResult(BaseModel):
    """
    Modelo para representar el resultado de una validación.
    """
    is_valid: bool
    validated_text: str
    error_message: Optional[str] = None