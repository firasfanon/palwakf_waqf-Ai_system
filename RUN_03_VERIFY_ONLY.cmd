@echo off
setlocal
set "SOURCE_ROOT=D:\waqf_ai_model"
set "ROOT=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%02_VERIFY.ps1" -SourceRoot "%SOURCE_ROOT%"
set "RC=%ERRORLEVEL%"
echo VERIFY_EXIT_CODE=%RC%
exit /b %RC%
