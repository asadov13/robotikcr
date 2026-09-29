@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js tapilmadi. Node.js qurasdirib yeniden acin.
  pause
  exit /b 1
)
node server.cjs
pause
