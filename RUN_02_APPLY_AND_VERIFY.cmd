@echo off
setlocal
set "ROOT=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%02_APPLY_AND_VERIFY.ps1"
set "RC=%ERRORLEVEL%"
echo APPLY_AND_VERIFY_EXIT_CODE=%RC%
exit /b %RC%
