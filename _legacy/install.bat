@echo off
echo Installing Dependencies...
echo.

echo [1/3] Installing workspace dependencies...
call npm install

echo.
echo [2/3] Installing server dependencies...
cd server
call npm install
cd ..

echo.
echo [3/3] Installing client dependencies...
cd client
call npm install
cd ..

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo You can now run:
echo   start-dev.bat    - Start both server and client
echo   npm run server   - Start server only
echo   npm run client   - Start client only
echo   npm run dev      - Start both (using concurrently)
echo.
pause
