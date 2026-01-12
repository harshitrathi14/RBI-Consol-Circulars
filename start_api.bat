@echo off
echo Starting RBI Circulars API Server...
echo.
cd /d "%~dp0"
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
pause
