"""
Main Entry Point - Runs both API and Streamlit servers
"""
import subprocess
import sys
import time
import socket
import threading
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from config import settings


def get_local_ip():
    """Get the local IP address of this machine"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"


def check_ollama():
    """Check if Ollama is running"""
    import httpx
    try:
        response = httpx.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=5)
        return response.status_code == 200
    except Exception:
        return False


def run_api():
    """Run the FastAPI server"""
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "api:app",
        "--host", settings.HOST,
        "--port", str(settings.API_PORT),
        "--reload"
    ], cwd=str(project_root))


def run_streamlit():
    """Run the Streamlit server"""
    subprocess.run([
        sys.executable, "-m", "streamlit", "run",
        "streamlit_app.py",
        "--server.address", settings.HOST,
        "--server.port", str(settings.STREAMLIT_PORT),
        "--server.headless", "true"
    ], cwd=str(project_root))


def main():
    print("=" * 60)
    print("RBI Master Circulars RAG Chatbot")
    print("=" * 60)

    # Check Ollama
    print("\nChecking Ollama status...")
    if check_ollama():
        print("✓ Ollama is running")
    else:
        print("✗ Ollama is not running!")
        print(f"  Please start Ollama and ensure '{settings.OLLAMA_MODEL}' model is available")
        print("  Run: ollama pull llama3")
        print()

    # Get network info
    local_ip = get_local_ip()

    print("\n" + "-" * 60)
    print("Starting servers...")
    print("-" * 60)

    # Start API in background thread
    api_thread = threading.Thread(target=run_api, daemon=True)
    api_thread.start()
    print(f"✓ API server starting on http://{local_ip}:{settings.API_PORT}")

    # Wait for API to start
    time.sleep(3)

    print(f"✓ Streamlit server starting on http://{local_ip}:{settings.STREAMLIT_PORT}")

    print("\n" + "=" * 60)
    print("ACCESS URLS (share with colleagues on same network):")
    print("=" * 60)
    print(f"  Web Interface:  http://{local_ip}:{settings.STREAMLIT_PORT}")
    print(f"  API Docs:       http://{local_ip}:{settings.API_PORT}/docs")
    print("=" * 60)
    print("\nPress Ctrl+C to stop all servers\n")

    # Run Streamlit in main thread (blocking)
    try:
        run_streamlit()
    except KeyboardInterrupt:
        print("\nShutting down...")


if __name__ == "__main__":
    main()
