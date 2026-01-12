"""
RAG Engine Module for RBI Master Circulars
Handles vector storage, retrieval, and LLM interaction via Ollama
"""
import os
from typing import List, Dict, Optional, Tuple
from pathlib import Path

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.llms import Ollama
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from config import settings
from document_processor import DocumentProcessor


class RAGEngine:
    """RAG Engine for querying RBI Master Circulars"""

    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        self.vector_store = None
        self.llm = None
        self.document_processor = DocumentProcessor()
        self._initialize()

    def _initialize(self):
        """Initialize vector store and LLM"""
        # Initialize LLM with Ollama
        self.llm = Ollama(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_MODEL,
            temperature=0.1,
        )

        # Load or create vector store
        self._load_or_create_vector_store()

    def _load_or_create_vector_store(self):
        """Load existing vector store or create new one"""
        persist_dir = str(settings.VECTOR_DB_DIR)

        if settings.VECTOR_DB_DIR.exists():
            print("Loading existing vector store...")
            self.vector_store = Chroma(
                persist_directory=persist_dir,
                embedding_function=self.embeddings,
                collection_name="rbi_circulars"
            )

            # Check for new/changed documents
            new_docs = self.document_processor.process_all_documents(force_reindex=False)
            if new_docs:
                print(f"Adding {len(new_docs)} new document chunks to vector store...")
                self.vector_store.add_documents(new_docs)
        else:
            print("Creating new vector store...")
            self._create_vector_store()

    def _create_vector_store(self):
        """Create vector store from scratch"""
        # Process all documents
        documents = self.document_processor.process_all_documents(force_reindex=True)

        if not documents:
            print("Warning: No documents found to index!")
            # Create empty vector store
            settings.VECTOR_DB_DIR.mkdir(parents=True, exist_ok=True)
            self.vector_store = Chroma(
                persist_directory=str(settings.VECTOR_DB_DIR),
                embedding_function=self.embeddings,
                collection_name="rbi_circulars"
            )
            return

        # Create vector store with documents
        settings.VECTOR_DB_DIR.mkdir(parents=True, exist_ok=True)
        self.vector_store = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=str(settings.VECTOR_DB_DIR),
            collection_name="rbi_circulars"
        )
        print(f"Vector store created with {len(documents)} chunks")

    def rebuild_index(self):
        """Force rebuild the entire vector index"""
        import shutil

        # Remove existing vector store
        if settings.VECTOR_DB_DIR.exists():
            shutil.rmtree(settings.VECTOR_DB_DIR)

        # Remove cache file
        if settings.INDEX_CACHE_FILE.exists():
            settings.INDEX_CACHE_FILE.unlink()

        # Recreate
        self.document_processor = DocumentProcessor()
        self._create_vector_store()
        print("Index rebuilt successfully!")

    def get_retriever(self, category: Optional[str] = None, k: int = None):
        """Get retriever with optional category filter"""
        k = k or settings.TOP_K_RESULTS

        if category and category != "All Categories":
            return self.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={
                    "k": k,
                    "filter": {"category": category}
                }
            )
        return self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": k}
        )

    def _get_prompt_template(self) -> ChatPromptTemplate:
        """Get the formal prompt template for RBI circular queries"""
        template = """You are a regulatory compliance assistant specializing in RBI (Reserve Bank of India) Master Circulars for Non-Banking Financial Companies (NBFCs). Your role is to provide accurate, formal responses based ONLY on the provided context from official RBI circulars.

CONTEXT FROM RBI MASTER CIRCULARS:
{context}

QUERY: {question}

INSTRUCTIONS:
1. Answer the query based STRICTLY on the information provided in the context above.
2. Use formal, professional language appropriate for regulatory compliance.
3. When possible, cite the specific circular reference, section, or paragraph number.
4. If the context contains relevant regulatory provisions, quote them accurately.
5. If the answer is not found in the provided context, respond with: "I cannot find a specific regulatory reference for this query in the available RBI Master Circulars. Please consult the original circulars or contact your compliance team."
6. Do not make assumptions or provide information beyond what is in the context.
7. Structure your response clearly with relevant headings if the answer is detailed.

RESPONSE:"""

        return ChatPromptTemplate.from_template(template)

    def _format_docs(self, docs: List[Document]) -> str:
        """Format retrieved documents for context"""
        formatted = []
        for i, doc in enumerate(docs, 1):
            source_info = []
            if doc.metadata.get("circular_number"):
                source_info.append(f"Circular: {doc.metadata['circular_number']}")
            if doc.metadata.get("category"):
                source_info.append(f"Category: {doc.metadata['category']}")
            if doc.metadata.get("filename"):
                source_info.append(f"Source: {doc.metadata['filename']}")

            header = f"[Reference {i}] " + " | ".join(source_info)
            formatted.append(f"{header}\n{doc.page_content}")

        return "\n\n---\n\n".join(formatted)

    def query(
        self,
        question: str,
        category: Optional[str] = None,
        return_sources: bool = True
    ) -> Dict:
        """
        Query the RAG system with a question.

        Args:
            question: The user's question
            category: Optional category filter
            return_sources: Whether to return source documents

        Returns:
            Dict with 'answer', 'sources', and 'category_used'
        """
        # Get retriever
        retriever = self.get_retriever(category=category)

        # Retrieve relevant documents
        docs = retriever.invoke(question)

        if not docs:
            return {
                "answer": "I cannot find a specific regulatory reference for this query in the available RBI Master Circulars. Please ensure the documents have been indexed or try a different query.",
                "sources": [],
                "category_used": category
            }

        # Format context
        context = self._format_docs(docs)

        # Create prompt
        prompt = self._get_prompt_template()

        # Create chain
        chain = (
            {"context": lambda x: context, "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )

        # Get answer
        answer = chain.invoke(question)

        # Prepare sources with full metadata
        sources = []
        if return_sources:
            for doc in docs:
                # Handle summary_points which may be stored as string in ChromaDB
                summary_points = doc.metadata.get("summary_points", [])
                if isinstance(summary_points, str):
                    try:
                        import json
                        summary_points = json.loads(summary_points)
                    except:
                        summary_points = [summary_points] if summary_points else []

                sources.append({
                    "filename": doc.metadata.get("filename", "Unknown"),
                    "category": doc.metadata.get("category", "Unknown"),
                    "circular_title": doc.metadata.get("circular_title"),
                    "circular_number": doc.metadata.get("circular_number"),
                    "circular_date": doc.metadata.get("circular_date"),
                    "subject": doc.metadata.get("subject"),
                    "summary_points": summary_points,
                    "chunk_preview": doc.page_content[:200] + "..."
                })

        return {
            "answer": answer,
            "sources": sources,
            "category_used": category
        }

    def get_document_stats(self) -> Dict:
        """Get statistics about indexed documents"""
        if not self.vector_store:
            return {"total_chunks": 0, "categories": {}}

        # Get all documents from collection
        collection = self.vector_store._collection
        results = collection.get(include=["metadatas"])

        total_chunks = len(results["ids"])
        categories = {}
        files = set()

        for metadata in results["metadatas"]:
            cat = metadata.get("category", "Unknown")
            categories[cat] = categories.get(cat, 0) + 1
            files.add(metadata.get("filename", "Unknown"))

        return {
            "total_chunks": total_chunks,
            "total_documents": len(files),
            "categories": categories
        }

    def get_categories(self) -> List[str]:
        """Get list of categories with documents"""
        stats = self.get_document_stats()
        return ["All Categories"] + sorted(stats["categories"].keys())

    def check_ollama_status(self) -> Tuple[bool, str]:
        """Check if Ollama is running and model is available"""
        import httpx

        try:
            response = httpx.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get("models", [])
                model_names = [m["name"] for m in models]

                if settings.OLLAMA_MODEL in model_names or f"{settings.OLLAMA_MODEL}:latest" in model_names:
                    return True, f"Ollama running with {settings.OLLAMA_MODEL}"

                return False, f"Model '{settings.OLLAMA_MODEL}' not found. Available: {model_names}"
            return False, f"Ollama returned status {response.status_code}"
        except httpx.ConnectError:
            return False, "Cannot connect to Ollama. Is it running?"
        except Exception as e:
            return False, f"Error checking Ollama: {str(e)}"

    def get_all_document_info(self, category: Optional[str] = None) -> List[Dict]:
        """Get information about all indexed documents"""
        import json

        if not self.vector_store:
            return []

        collection = self.vector_store._collection
        results = collection.get(include=["metadatas"])

        # Group by filename to get unique documents
        documents = {}
        for metadata in results["metadatas"]:
            filename = metadata.get("filename", "Unknown")
            if filename not in documents:
                # Parse summary_points if stored as string
                summary_points = metadata.get("summary_points", [])
                if isinstance(summary_points, str):
                    try:
                        summary_points = json.loads(summary_points)
                    except:
                        summary_points = [summary_points] if summary_points else []

                documents[filename] = {
                    "filename": filename,
                    "circular_title": metadata.get("circular_title"),
                    "circular_number": metadata.get("circular_number"),
                    "circular_date": metadata.get("circular_date"),
                    "category": metadata.get("category", "Unknown"),
                    "subject": metadata.get("subject"),
                    "summary_points": summary_points,
                    "total_chunks": metadata.get("total_chunks", 0)
                }

        # Filter by category if specified
        result = list(documents.values())
        if category and category != "All Categories":
            result = [d for d in result if d["category"] == category]

        # Sort by circular title or filename
        result.sort(key=lambda x: x.get("circular_title") or x.get("filename") or "")

        return result

    def get_document_by_filename(self, filename: str) -> Optional[Dict]:
        """Get detailed information about a specific document"""
        import json

        if not self.vector_store:
            return None

        collection = self.vector_store._collection
        results = collection.get(
            where={"filename": filename},
            include=["metadatas"]
        )

        if not results["metadatas"]:
            return None

        metadata = results["metadatas"][0]

        # Parse summary_points if stored as string
        summary_points = metadata.get("summary_points", [])
        if isinstance(summary_points, str):
            try:
                summary_points = json.loads(summary_points)
            except:
                summary_points = [summary_points] if summary_points else []

        return {
            "filename": metadata.get("filename", "Unknown"),
            "circular_title": metadata.get("circular_title"),
            "circular_number": metadata.get("circular_number"),
            "circular_date": metadata.get("circular_date"),
            "category": metadata.get("category", "Unknown"),
            "subject": metadata.get("subject"),
            "summary_points": summary_points,
            "total_chunks": metadata.get("total_chunks", 0)
        }


# Initialize singleton instance
_rag_engine = None


def get_rag_engine() -> RAGEngine:
    """Get or create RAG engine singleton"""
    global _rag_engine
    if _rag_engine is None:
        _rag_engine = RAGEngine()
    return _rag_engine


if __name__ == "__main__":
    # Test RAG engine
    print("Initializing RAG Engine...")
    engine = RAGEngine()

    # Check Ollama status
    status, msg = engine.check_ollama_status()
    print(f"Ollama Status: {msg}")

    # Get stats
    stats = engine.get_document_stats()
    print(f"\nDocument Stats: {stats}")

    if stats["total_chunks"] > 0:
        # Test query
        print("\nTesting query...")
        result = engine.query("What are the capital adequacy requirements for NBFCs?")
        print(f"Answer: {result['answer'][:500]}...")
        print(f"\nSources: {len(result['sources'])} documents")
