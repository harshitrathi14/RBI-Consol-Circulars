"""
FastAPI Backend for RBI Master Circulars RAG Chatbot
"""
from typing import Optional, List
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from config import settings
from rag_engine import get_rag_engine


# Pydantic Models
class QueryRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)
    category: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What are the capital adequacy requirements for NBFCs?",
                "category": "Capital Adequacy"
            }
        }


class SourceDocument(BaseModel):
    filename: str
    category: str
    circular_title: Optional[str]
    circular_number: Optional[str]
    circular_date: Optional[str]
    subject: Optional[str]
    summary_points: Optional[List[str]]
    chunk_preview: str


class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceDocument]
    category_used: Optional[str]
    circulars_referenced: List[str]  # List of circular titles used


class DocumentInfo(BaseModel):
    filename: str
    circular_title: Optional[str]
    circular_number: Optional[str]
    circular_date: Optional[str]
    category: str
    subject: Optional[str]
    summary_points: List[str]
    total_chunks: int


class DocumentStats(BaseModel):
    total_chunks: int
    total_documents: int
    categories: dict


class HealthResponse(BaseModel):
    status: str
    ollama_status: str
    ollama_message: str
    documents_indexed: int


class RebuildResponse(BaseModel):
    message: str
    status: str


# FastAPI App
app = FastAPI(
    title="RBI Master Circulars RAG API",
    description="API for querying RBI Master Circulars for NBFCs using RAG",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize RAG engine on startup"""
    print("Starting RBI Circulars RAG API...")
    engine = get_rag_engine()
    status, msg = engine.check_ollama_status()
    if not status:
        print(f"WARNING: Ollama issue - {msg}")
    print("API Ready!")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API info"""
    return {
        "message": "RBI Master Circulars RAG API",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Check system health including Ollama status"""
    engine = get_rag_engine()
    ollama_ok, ollama_msg = engine.check_ollama_status()
    stats = engine.get_document_stats()

    return HealthResponse(
        status="healthy" if ollama_ok else "degraded",
        ollama_status="ok" if ollama_ok else "error",
        ollama_message=ollama_msg,
        documents_indexed=stats["total_chunks"]
    )


@app.get("/categories", response_model=List[str], tags=["Documents"])
async def get_categories():
    """Get list of available document categories"""
    engine = get_rag_engine()
    return engine.get_categories()


@app.get("/stats", response_model=DocumentStats, tags=["Documents"])
async def get_stats():
    """Get document indexing statistics"""
    engine = get_rag_engine()
    return engine.get_document_stats()


@app.get("/documents", response_model=List[DocumentInfo], tags=["Documents"])
async def get_all_documents(category: Optional[str] = None):
    """
    Get list of all indexed circulars with their metadata and summaries.
    Optionally filter by category.
    """
    engine = get_rag_engine()
    docs = engine.get_all_document_info(category=category)
    return [DocumentInfo(**d) for d in docs]


@app.get("/documents/{filename}", response_model=DocumentInfo, tags=["Documents"])
async def get_document_info(filename: str):
    """Get detailed information about a specific circular"""
    engine = get_rag_engine()
    doc = engine.get_document_by_filename(filename)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentInfo(**doc)


@app.post("/query", response_model=QueryResponse, tags=["Query"])
async def query_circulars(request: QueryRequest):
    """
    Query RBI Master Circulars using RAG.

    - **question**: Your regulatory query
    - **category**: Optional category filter (e.g., 'Capital Adequacy', 'KYC/AML')
    """
    engine = get_rag_engine()

    # Check Ollama status
    ollama_ok, ollama_msg = engine.check_ollama_status()
    if not ollama_ok:
        raise HTTPException(
            status_code=503,
            detail=f"LLM service unavailable: {ollama_msg}"
        )

    try:
        result = engine.query(
            question=request.question,
            category=request.category,
            return_sources=True
        )

        # Extract unique circular titles referenced
        circulars_referenced = list(set(
            s.get("circular_title") or s.get("filename", "Unknown")
            for s in result["sources"]
        ))

        return QueryResponse(
            answer=result["answer"],
            sources=[SourceDocument(**s) for s in result["sources"]],
            category_used=result["category_used"],
            circulars_referenced=circulars_referenced
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing query: {str(e)}"
        )


@app.post("/rebuild-index", response_model=RebuildResponse, tags=["System"])
async def rebuild_index(background_tasks: BackgroundTasks):
    """
    Trigger a full rebuild of the document index.
    This runs in the background and may take several minutes.
    """
    def do_rebuild():
        engine = get_rag_engine()
        engine.rebuild_index()

    background_tasks.add_task(do_rebuild)

    return RebuildResponse(
        message="Index rebuild started in background",
        status="processing"
    )


def start_api():
    """Start the FastAPI server"""
    uvicorn.run(
        "api:app",
        host=settings.HOST,
        port=settings.API_PORT,
        reload=False,
        workers=1
    )


if __name__ == "__main__":
    start_api()
