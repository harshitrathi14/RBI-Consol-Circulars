@echo off
echo ============================================================
echo RBI Master Circulars RAG Chatbot
echo ============================================================
echo.

REM Check if Ollama is running
echo Checking Ollama status...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Ollama is not running!
    echo Please start Ollama and run: ollama pull llama3
    echo.
)

cd /d "%~dp0"

echo Starting API server...
start "RBI API Server" cmd /k "python -m uvicorn api:app --host 0.0.0.0 --port 8000"

echo Waiting for API to initialize...
timeout /t 5 /nobreak >nul

echo Starting Streamlit interface...
start "RBI Streamlit" cmd /k "python -m streamlit run streamlit_app.py --server.address 0.0.0.0 --server.port 8501"

echo.
echo ============================================================
echo Servers are starting...
echo.
echo Web Interface: http://localhost:8501
echo API Docs:      http://localhost:8000/docs
echo.
echo To find your IP for sharing, run: ipconfig
echo ============================================================
pause
