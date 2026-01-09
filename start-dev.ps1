# HDC Dashboard Development Servers Startup Script
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  HDC Dashboard Dev Environment  " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Start backend server in background
Write-Host "[1/2] Starting backend server on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node --import tsx backend/server.ts" -WorkingDirectory $PSScriptRoot

# Wait a bit for backend to start
Start-Sleep -Seconds 2

# Start frontend Vite dev server
Write-Host "[2/2] Starting frontend Vite server on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node node_modules/vite/bin/vite.js frontend" -WorkingDirectory $PSScriptRoot

# Wait for servers to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  Servers are starting!             " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend:    " -NoNewline
Write-Host "http://localhost:5173/hdc.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C in each terminal to stop servers" -ForegroundColor Yellow
