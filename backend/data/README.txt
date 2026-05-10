# Directorio de Datos Permanentes

Este directorio contiene documentos de conocimiento base permanente del sistema.

## Libros Base (books/)

Coloca aquí los PDFs de libros base del sistema.

Libros actuales:
```
backend/data/books/
├── electronica_boylestad.pdf
└── fundamentos-de-sistemas_floyd.pdf
```

## ¿Cuándo cargar los libros base?

### Importante: Solo necesitas cargar los libros UNA vez

**Los libros base solo se cargan la primera vez** que configures el sistema. ChromaDB es persistente y guarda los embeddings en volumen Docker, así que:

- ❌ **NO** necesitas cargar los libros cada vez que corras el backend
- ❌ **NO** necesitas cargar los libros cada vez que reinicies Docker
- ✅ Solo los cargas una vez al principio
- ✅ Los embeddings persisten entre reinicios
- ✅ Otros compañeros que usen Docker **NO** necesitan cargarlos si usan el mismo volumen

### ¿Qué pasa si otros compañeros usan Docker?

Depende de tu configuración de volúmenes:

**Si usan el mismo volumen Docker (compartido):**
- ✅ Los compañeros **NO** necesitan cargar los libros
- ✅ Los embeddings ya están ahí

**Si cada uno tiene su propio volumen:**
- ❌ Cada compañero **SÍ** necesita cargar los libros en su entorno
- ❌ Cada uno debe ejecutar el script en su máquina

## Cargar un libro base

Para cargar un libro base en ChromaDB con metadata académica, usa el script genérico.

**IMPORTANTE:** El script debe ejecutarse dentro del contenedor Docker porque las dependencias de Python están ahí.

```bash
# Inicia los contenedores Docker
docker compose up -d

# Ejecuta el script dentro del contenedor backend
docker compose exec backend python scripts/load_base_book.py --book boylestad --knowledge_base electronics --filename electronica_boylestad.pdf
```

```bash
docker compose exec backend python scripts/load_base_book.py --book floyd --knowledge_base digital_systems --filename fundamentos-de-sistemas_floyd.pdf
```

Este script:
- Lee el PDF de `backend/data/books/{book}.pdf`
- Extrae metadata académica (capítulos, secciones) automáticamente
- Indexa con `document_type="base_knowledge"`
- Protege contra re-indexación duplicada (si ya existe, no lo re-indexa)

## Argumentos del script

- `--book`: Identificador del libro (ej: `sedra_smith`, `serway`)
- `--knowledge-base`: Área de conocimiento (ej: `electronics`, `signals`, `control_systems`)
- `--filename` (opcional): Nombre del archivo PDF si difiere del identificador del libro

## Ejemplos

```bash
# Cargar Boylestad para electrónica
docker compose exec backend python scripts/load_base_book.py --book boylestad --knowledge_base electronics --filename electronica_boylestad.pdf

# Cargar Floyd para sistemas digitales
docker compose exec backend python scripts/load_base_book.py --book floyd --knowledge_base digital_systems --filename fundamentos-de-sistemas_floyd.pdf
```

## Verificar libros cargados

Para ver qué libros están indexados en ChromaDB:

```bash
# Inicia el backend
docker compose up

# Visita el endpoint de debug
http://localhost:8000/documents
```

Este endpoint muestra todos los documentos indexados con sus chunks.
