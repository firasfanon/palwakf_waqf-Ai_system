@echo off
setlocal
set "ROOT=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%01_POST_APPLY_VERIFY.ps1" -ProjectRoot "D:\waqf_ai_model"
set "RC=%ERRORLEVEL%"
echo POST_APPLY_VERIFY_EXIT_CODE=%RC%
exit /b %RC%
