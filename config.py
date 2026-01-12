"""
Configuration settings for RBI Master Circulars RAG Chatbot
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Paths
    PROJECT_ROOT: Path = Path(__file__).parent
    DOCUMENTS_DIR: Path = Path(r"C:/D Drive/RBI Master Circulars_NBFC")
    VECTOR_DB_DIR: Path = PROJECT_ROOT / "vector_store"
    INDEX_CACHE_FILE: Path = PROJECT_ROOT / "index_cache.json"

    # Server
    HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    STREAMLIT_PORT: int = 8501

    # Ollama - Use localhost for local Ollama, or remote server IP
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:latest"

    # Embedding
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    # RAG Settings
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K_RESULTS: int = 5

    # Categories mapping based on common RBI circular topics
    CATEGORY_KEYWORDS: dict = {
        "Asset Classification": ["asset", "classification", "npa", "non-performing", "provisioning"],
        "Fair Practices Code": ["fair practice", "fpc", "customer", "grievance", "complaint"],
        "ALM (Asset Liability Management)": ["alm", "asset liability", "liquidity", "mismatch"],
        "Capital Adequacy": ["capital", "crar", "tier", "adequacy", "basel"],
        "Corporate Governance": ["governance", "board", "director", "audit", "compliance"],
        "KYC/AML": ["kyc", "aml", "know your customer", "anti-money", "cdd", "due diligence"],
        "Deposit": ["deposit", "public deposit", "interest rate"],
        "Credit": ["credit", "loan", "lending", "exposure", "concentration"],
        "Investment": ["investment", "securities", "portfolio"],
        "Reporting": ["reporting", "return", "submission", "disclosure"],
        "Registration": ["registration", "license", "certificate", "cos"],
        "General": []  # Default category
    }

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
