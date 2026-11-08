@echo off
title SAORI // JARVIS NEURAL CORE - WALLPAPER PREVIEW
color 0b
echo ========================================================
echo   SAORI // JARVIS NEURAL CORE - WALLPAPER ENGINE PREVIEW
echo   Lanzando servidor local y abriendo visor WebGL...
echo ========================================================
echo.

cd /d "%~dp0"
start "" python -m http.server 8769 --bind 127.0.0.1
timeout /t 1 >nul

set "BRAVE_PATH=%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe"
if exist "%BRAVE_PATH%" (
    start "" "%BRAVE_PATH%" --app="http://127.0.0.1:8769/index.html" --window-size=1920,1080
) else (
    start http://127.0.0.1:8769/index.html
)

echo [✓] Visualizador en ejecucion. Presiona cualquier tecla para cerrar.
pause >nul
