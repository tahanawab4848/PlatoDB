@echo off
title FlowForge Launcher
echo.
echo  ==========================================
echo    FlowForge - AI Database Architecture
echo  ==========================================
echo.
echo  [1/2] Starting Backend (Express + Socket.io)...
start cmd /k "cd /d %~dp0 && node server/index.js"

echo  [2/2] Starting Frontend (Vite + React)...
start cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo  Waiting for servers to start...
timeout /t 6 /nobreak >nul

echo  Opening FlowForge in your browser...
start http://localhost:5173

echo.
echo  FlowForge is running!
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo.
