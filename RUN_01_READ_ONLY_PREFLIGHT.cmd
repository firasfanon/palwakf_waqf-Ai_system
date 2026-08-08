@echo off
setlocal
set "ROOT=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%01_READ_ONLY_PREFLIGHT.ps1"
set "RC=%ERRORLEVEL%"
echo DEFAULT_PRIVILEGES_PREFLIGHT_EXIT_CODE=%RC%
exit /b %RC%
