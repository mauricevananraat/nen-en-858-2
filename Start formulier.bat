@echo off
REM Start het NEN-EN-858-2 controleformulier via een lokale http-server.
REM Reden: ES modules (type="module") werken niet onder file:// vanwege CORS.

setlocal
cd /d "%~dp0"

set PORT=8766
set URL=http://localhost:%PORT%/NEN-EN-858-2%%20controle%%20formulier.html

echo.
echo ============================================================
echo  Symitech - NEN-EN-858-2 controle formulier
echo ============================================================
echo  Server start op poort %PORT%...
echo  Sluit dit venster om de server te stoppen.
echo ============================================================
echo.

REM Probeer Python (py launcher of python in PATH)
py --version >nul 2>&1
if %errorlevel% == 0 (
    start "" "" "%ProgramFiles%\Mozilla Firefox\firefox.exe" "%URL%" 2>nul || start "" "%URL%"
    py -m http.server %PORT%
    goto :end
)

python --version >nul 2>&1
if %errorlevel% == 0 (
    start "" "" "%ProgramFiles%\Mozilla Firefox\firefox.exe" "%URL%" 2>nul || start "" "%URL%"
    python -m http.server %PORT%
    goto :end
)

REM Fallback naar Node http-server uit node_modules
if exist "node_modules\.bin\http-server.cmd" (
    start "" "" "%ProgramFiles%\Mozilla Firefox\firefox.exe" "%URL%" 2>nul || start "" "%URL%"
    "node_modules\.bin\http-server.cmd" -p %PORT% -c-1
    goto :end
)

echo FOUT: Geen Python of http-server gevonden.
echo Installeer Python via Microsoft Store of installeer http-server:
echo   npm install --save-dev http-server
echo.
pause

:end
endlocal
