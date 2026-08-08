@echo off
setlocal
set "ROOT=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%02_CLASSIFY_FULL_TEST_FAILURES.ps1"
set "RC=%ERRORLEVEL%"
echo TEST_GATE_CLASSIFICATION_EXIT_CODE=%RC%
exit /b %RC%
