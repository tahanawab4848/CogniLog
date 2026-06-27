@echo off
echo ===================================================
echo ⏳ Starting CogniLog
echo ===================================================

echo Starting the FastAPI Backend server...
start "CogniLog Backend" cmd /k "cd /d %~dp0backend && echo Installing Backend Dependencies globally... && python -m pip install -r requirements.txt && echo Starting Server... && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Starting the Vite Frontend server...
start "CogniLog Frontend" cmd /k "cd /d %~dp0frontend && echo Installing Frontend Dependencies... && npm install && npm run dev"

echo Both servers are launching in separate windows!
echo Once they are ready, your frontend will be available at http://localhost:5173
echo ===================================================
timeout /t 3
