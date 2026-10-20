@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist server\node_modules (
  echo Chua cai dat. Hay chay setup.bat truoc.
  pause & exit /b 1
)
start "SalesFlow - API server (khong tat)" cmd /k "cd /d "%~dp0server" && npm start"
start "SalesFlow - Giao dien (khong tat)" cmd /k "cd /d "%~dp0client" && npm run dev"
timeout /t 6 >nul
start http://localhost:5173
