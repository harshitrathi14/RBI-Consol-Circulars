# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **RegTech RAG (Retrieval-Augmented Generation) Chatbot** for querying RBI (Reserve Bank of India) Master Circulars for Non-Banking Financial Companies (NBFCs). It provides a local-network-sharable web application where employees can query regulatory documents using natural language.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Streamlit Frontend                          │
│  (Dashboard | Circular Library | Chat Interface)                │
│  streamlit_app.py - Port 8501                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                            │
│  api.py - Port 8000                                             │
│  Endpoints: /query, /documents, /categories, /stats, /health   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       RAG Engine                                │
│  rag_engine.py                                                  │
│  - LangChain pipeline                                           │
│  - ChromaDB vector store (./vector_store/)                      │
│  - HuggingFace embeddings (all-MiniLM-L6-v2)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Document Processor                           │
│  document_processor.py                                          │
│  - PDF text extraction (PyPDF2)                                │
│  - Category detection from content                              │
│  - Circular title/metadata extraction                           │
│  - Summary point generation                                     │
│  - Recursive text chunking                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Ollama LLM                                 │
│  Local LLM server (llama3 or mistral)                          │
│  Default: http://localhost:11434                                │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `config.py` | Central configuration (paths, ports, models, category keywords) |
| `document_processor.py` | PDF ingestion, chunking, category tagging, metadata extraction |
| `rag_engine.py` | Vector store management, retrieval, LLM query pipeline |
| `api.py` | FastAPI REST endpoints |
| `streamlit_app.py` | Web UI with dashboard, library, and chat |
| `run.py` | Combined startup script for both servers |

## Commands

### Initial Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Pull Ollama model (required)
ollama pull llama3
# OR
ollama pull mistral

# Start Ollama server (if not running)
ollama serve
```

### Running the Application
```bash
# Option 1: Run both servers together
python run.py

# Option 2: Run servers separately
# Terminal 1 - API
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Streamlit
python -m streamlit run streamlit_app.py --server.address 0.0.0.0 --server.port 8501

# Option 3: Windows batch files
start_all.bat      # Both servers
start_api.bat      # API only
start_streamlit.bat # Streamlit only
```

### First Run - Index Building
On first startup, the system automatically:
1. Scans `./` directory for PDF files
2. Extracts text and metadata from each PDF
3. Detects category based on content keywords
4. Generates summary points
5. Chunks documents and creates embeddings
6. Stores in ChromaDB vector database

### Rebuild Index
```bash
# Via API
curl -X POST http://localhost:8000/rebuild-index

# Or use "Rebuild Index" button in Streamlit sidebar
```

### Find Your IP Address (for network sharing)
```bash
# Windows
ipconfig | findstr IPv4

# Linux/Mac
hostname -I
```

Access URLs:
- Web Interface: `http://192.168.16.88:8501`
- API Docs: `http://192.168.16.88:8000/docs`

## Configuration

Edit `config.py` to change:
- `DOCUMENTS_DIR`: Location of PDF circulars
- `OLLAMA_MODEL`: LLM model name ("llama3", "mistral", etc.)
- `CHUNK_SIZE` / `CHUNK_OVERLAP`: Text chunking parameters
- `TOP_K_RESULTS`: Number of chunks retrieved per query
- `CATEGORY_KEYWORDS`: Keywords for automatic category detection

## Data Flow

1. **Document Ingestion**: PDFs → PyPDF2 → Text chunks with metadata
2. **Embedding**: Chunks → HuggingFace (all-MiniLM-L6-v2) → Vectors
3. **Storage**: Vectors + metadata → ChromaDB (./vector_store/)
4. **Query**: User question → Embedding → Similarity search → Top-K chunks
5. **Generation**: Chunks + Question → Ollama LLM → Formatted response

## Index Caching

The system maintains `index_cache.json` with file hashes. On startup:
- Unchanged files are skipped
- New/modified files are processed and added
- Deleted files trigger warnings (manual rebuild needed for full cleanup)

## Category System

Categories are auto-detected from PDF content using keyword matching:
- Asset Classification
- Fair Practices Code
- ALM (Asset Liability Management)
- Capital Adequacy
- Corporate Governance
- KYC/AML
- Deposit, Credit, Investment
- Reporting, Registration
- General (fallback)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | System health check |
| `/categories` | GET | List available categories |
| `/stats` | GET | Document statistics |
| `/documents` | GET | List all circulars with metadata |
| `/documents/{filename}` | GET | Single circular details |
| `/query` | POST | RAG query with optional category filter |
| `/rebuild-index` | POST | Trigger full reindex |

## Troubleshooting

**Ollama not connecting**: Ensure `ollama serve` is running and model is pulled
**No documents indexed**: Check PDF files are in correct directory, run rebuild
**ChromaDB errors**: Delete `./vector_store/` folder and restart
**Slow queries**: Reduce `TOP_K_RESULTS` or use smaller LLM model
