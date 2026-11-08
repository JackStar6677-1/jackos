@echo off
title JackOS // Sovereign JARVIS HUD
color 0b
echo ========================================================
echo   JACKOS // SOVEREIGN JARVIS CONSOLE ^& HUD
echo   Iniciando puente seguro local y abriendo consola HUD...
echo ========================================================
echo.

cd /d "%~dp0"
python jackos_bridge.py

pause
