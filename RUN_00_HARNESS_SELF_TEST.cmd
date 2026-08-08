@echo off
setlocal
set "ROOT=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%00_HARNESS_SELF_TEST.ps1"
set "RC=%ERRORLEVEL%"
echo HARNESS_SELF_TEST_EXIT_CODE=%RC%
exit /b %RC%
