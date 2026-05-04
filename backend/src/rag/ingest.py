"""Pipeline de ingestion de documentos PDF.

Convierte un PDF en texto, lo divide en chunks y los indexa en ChromaDB para
que luego puedan recuperarse durante la fase de preguntas.
"""

import io
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from db.chroma_client import get_vectorstore
from config import settings


def parse_pdf(file_bytes: bytes, source_filename: str) -> list[Document]:
    """Extrae texto por pagina y retorna documentos con metadatos."""

    # PdfReader trabaja sobre un stream en memoria, sin guardar archivos en disco.
    reader = PdfReader(io.BytesIO(file_bytes))
    documents: list[Document] = []
    for page_index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        if not text.strip():
            continue
        documents.append(
            Document(
                page_content=text,
                metadata={"source": source_filename, "page": page_index},
            )
        )
    return documents


def split_into_chunks(documents: list[Document]) -> list[Document]:
    """Divide documentos por pagina en chunks con overlap."""
    # RecursiveCharacterTextSplitter intenta respetar separadores naturales
    # antes de cortar por longitud pura.
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""],
    )
    return splitter.split_documents(documents)


def ingest_pdf(file_bytes: bytes, filename: str) -> int:
    """
    Pipeline completo de ingestión:
    1. Parsea el PDF
    2. Divide en chunks
    3. Genera embeddings y guarda en ChromaDB

    Retorna el número de chunks indexados.
    """
    page_documents = parse_pdf(file_bytes, filename)

    if not page_documents:
        raise ValueError("El PDF no contiene texto extraíble (puede ser un PDF escaneado).")

    documents = split_into_chunks(page_documents)
    vectorstore = get_vectorstore()

    # add_documents dispara el calculo de embeddings y la insercion en Chroma.
    vectorstore.add_documents(documents)

    return len(documents)
