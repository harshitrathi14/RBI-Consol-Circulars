"""Test imports for debugging"""
import sys
print(f"Python: {sys.version}")

try:
    print("Testing imports...")

    from config import settings
    print(f"✓ config - OLLAMA: {settings.OLLAMA_BASE_URL}")

    from langchain_community.vectorstores import Chroma
    print("✓ langchain Chroma")

    from langchain_community.embeddings import HuggingFaceEmbeddings
    print("✓ HuggingFaceEmbeddings")

    from langchain_community.llms import Ollama
    print("✓ Ollama LLM")

    from document_processor import DocumentProcessor
    print("✓ DocumentProcessor")

    from rag_engine import RAGEngine
    print("✓ RAGEngine")

    print("\nAll imports successful!")

except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
