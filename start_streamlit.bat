@echo off
echo Starting RBI Circulars Streamlit Interface...
echo.
cd /d "%~dp0"
python -m streamlit run streamlit_app.py --server.address 0.0.0.0 --server.port 8501
pause
