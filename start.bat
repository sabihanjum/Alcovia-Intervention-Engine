@echo off
echo ========================================
echo Alcovia Intervention Engine
echo ========================================
echo.
echo Starting Backend Server...
start cmd /k "cd server && npm start"
timeout /t 3 /nobreak > nul
echo.
echo Starting Frontend App...
start cmd /k "cd client && npm start"
echo.
echo ========================================
echo Both servers are starting!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to exit this window...
pause > nul
