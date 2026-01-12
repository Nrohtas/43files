@echo off
echo ========================================
echo   Starting 43files Dashboard
echo ========================================
echo.
echo [1/2] Starting Server (Backend)...
start "43files-Server" cmd /k "cd /d %~dp0server && ..\node_modules\.bin\tsx.cmd watch src/index.ts"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Client (Frontend)...
echo.
echo ========================================
echo   URLs:
echo   Server: http://localhost:3000
echo   Client: http://localhost:5173
echo ========================================
echo.
echo Dashboard: http://localhost:5173/src/pages/hdc/dashboard.html
echo.
echo Press Ctrl+C to stop the client...
echo (Server window will remain open separately)
echo.

cd /d %~dp0client
..\node_modules\.bin\vite.cmd

echo.
echo Stopping server...
taskkill /FI "WINDOWTITLE eq 43files-Server*" /T /F >nul 2>&1
echo Done!
pause
