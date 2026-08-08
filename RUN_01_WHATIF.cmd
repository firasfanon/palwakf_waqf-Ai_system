@echo off
setlocal
set "ROOT=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%01_WHATIF.ps1"
set "RC=%ERRORLEVEL%"
echo WHATIF_EXIT_CODE=%RC%
exit /b %RC%
