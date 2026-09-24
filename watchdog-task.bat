@echo off
REM OpenReply DM worker watchdog - NO WINDOW POPUP VERSION
REM Checks every 5 min for dm-worker.ts; starts it if missing.
setlocal EnableExtensions
set "NODE_DIR=D:\LocalAI\DeepSeek-R1-8B\hermes\node"
set "PROJ=D:\LocalAI\±M®×\openreply"
set "PATH=%NODE_DIR%;%PATH%"

timeout /t 300 /nobreak >nul

:check
powershell -NoProfile -Command "$c=(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*dm-worker.ts*' } | Measure-Object).Count; exit $c"
if %errorlevel%==0 (
    if not exist "%PROJ%\logs" mkdir "%PROJ%\logs"
    echo [%date% %time%] watchdog: dm-worker missing >> "%PROJ%\logs\watchdog.log"
    start /b cmd /s /c "cd /d %PROJ% && node %NODE_DIR%\node_modules\npm\bin\npx-cli.js tsx --env-file=.env worker/dm-worker.ts >> %PROJ%\logs\worker.log 2>&1"
)
timeout /t 300 /nobreak >nul
goto check
