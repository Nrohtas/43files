# Quick Start Script
# This script starts both server and client for development

Write-Host "Starting 43files Dashboard..." -ForegroundColor Green
Write-Host ""

# Start Server in background
Write-Host "Starting Server..." -ForegroundColor Cyan
$serverJob = Start-Job -ScriptBlock {
    Set-Location "E:\Dashboard\43files"
    npx tsx server/src/index.ts
}

# Wait a bit for server to start
Start-Sleep -Seconds 2

# Start Vite Client
Write-Host "Starting Client (Vite)..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Server: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Client: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop both server and client" -ForegroundColor Gray
Write-Host ""

# Run vite in foreground (so we can see output and stop with Ctrl+C)
try {
    npx vite client
} finally {
    # Clean up background job when vite stops
    Write-Host "`nStopping server..." -ForegroundColor Yellow
    Stop-Job $serverJob
    Remove-Job $serverJob
    Write-Host "Done!" -ForegroundColor Green
}
