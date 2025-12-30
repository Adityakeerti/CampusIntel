@echo off
setlocal

:START_ALL
cls
echo ==================================================
echo   Starting Unified Campus Intelligence System
echo ==================================================

echo.
echo [0/9] Checking MongoDB service...
call :CHECK_MONGODB
if errorlevel 1 (
    echo       WARNING: MongoDB service not running!
    echo       Agent1 requires MongoDB. Please start MongoDB service.
    echo       Run: Start-Service MongoDB
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
)
echo       MongoDB check complete.

echo.
echo [1/9] Cleaning up any existing processes on ports...
call :KILL_PORT 8080
call :KILL_PORT 8082
call :KILL_PORT 8083
call :KILL_PORT 8000
call :KILL_PORT 8010
call :KILL_PORT 8002
call :KILL_PORT 9443
call :KILL_PORT 9444
timeout /t 2 /nobreak >nul
echo       Cleanup complete.

echo.
echo [2/9] Starting Main Backend (Port 8080)...
call :START_MAIN

echo.
echo [3/9] Starting Meeting Service (Port 8082)...
call :START_MEETING

echo.
echo [4/9] Starting Chat Service (Port 8083)...
call :START_CHAT

echo.
echo [5/9] Starting OCR Service (Port 8000)...
call :START_OCR

echo.
echo [6/9] Starting AI Chat Agent (Port 8010)...
echo       Note: Agent1 requires MongoDB to be running.
call :START_AGENT

echo.
echo [7/9] Starting Library Service (Port 8002)...
call :START_LIB

echo.
echo [8/9] Starting Mobile Scanner HTTPS (Port 9443)...
call :START_SCANNER

echo.
echo [9/9] Starting VBoard HTTPS (Port 9444)...
call :START_VBOARD

goto MENU


:MENU
echo.
echo ==================================================
echo   System Control Panel
echo ==================================================
echo   1. Restart Main Backend (8080)
echo   2. Restart Meeting Service (8082)
echo   3. Restart Chat Service (8083)
echo   4. Restart OCR Service (8000)
echo   5. Restart AI Chat Agent (8010)
echo   6. Restart Library Service (8002)
echo   7. Restart Mobile Scanner HTTPS (9443)
echo   8. Restart VBoard HTTPS (9444)
echo   9. Restart ALL
echo   0. Exit
echo ==================================================
echo.
set /p choice=Enter selection [0-9]: 

if "%choice%"=="1" goto RESTART_MAIN
if "%choice%"=="2" goto RESTART_MEETING
if "%choice%"=="3" goto RESTART_CHAT
if "%choice%"=="4" goto RESTART_OCR
if "%choice%"=="5" goto RESTART_AGENT
if "%choice%"=="6" goto RESTART_LIB
if "%choice%"=="7" goto RESTART_SCANNER
if "%choice%"=="8" goto RESTART_VBOARD
if "%choice%"=="9" goto START_ALL
if "%choice%"=="0" exit
goto MENU


:RESTART_MAIN
echo Stopping Port 8080...
call :KILL_PORT 8080
echo Starting Main Backend...
call :START_MAIN
goto MENU

:RESTART_MEETING
echo Stopping Port 8082...
call :KILL_PORT 8082
echo Starting Meeting Service...
call :START_MEETING
goto MENU

:RESTART_CHAT
echo Stopping Port 8083...
call :KILL_PORT 8083
echo Starting Chat Service...
call :START_CHAT
goto MENU

:RESTART_OCR
echo Stopping Port 8000...
call :KILL_PORT 8000
echo Starting OCR Service...
call :START_OCR
goto MENU

:RESTART_AGENT
echo Stopping Port 8010...
call :KILL_PORT 8010
echo Starting AI Chat Agent...
call :START_AGENT
goto MENU

:RESTART_LIB
echo Stopping Port 8002...
call :KILL_PORT 8002
echo Starting Library Service...
call :START_LIB
goto MENU

:RESTART_SCANNER
echo Stopping Port 9443...
call :KILL_PORT 9443
echo Starting Mobile Scanner HTTPS...
call :START_SCANNER
goto MENU

:RESTART_VBOARD
echo Stopping Port 9444...
call :KILL_PORT 9444
echo Starting VBoard HTTPS...
call :START_VBOARD
goto MENU


REM ==================================================
REM Subroutines
REM ==================================================


:CHECK_MONGODB
REM Check if MongoDB service is running
sc query MongoDB | findstr "RUNNING" >nul
if errorlevel 1 (
    echo       MongoDB service is not running.
    exit /b 1
) else (
    echo       MongoDB service is running.
    exit /b 0
)


:START_MAIN
start "Main Backend (backend-ai)" cmd /k "cd backend-ai && mvnw spring-boot:run -Dspring-boot.run.arguments=--server.address=0.0.0.0"
exit /b

:START_MEETING
start "Meeting Service (backend-meeting)" cmd /k "cd backend-meeting && mvnw spring-boot:run -Dspring-boot.run.arguments=--server.address=0.0.0.0"
exit /b

:START_CHAT
start "Chat Service (backend-chat)" cmd /k "cd backend-chat && mvnw spring-boot:run -Dspring-boot.run.arguments=--server.address=0.0.0.0"
exit /b

:START_OCR
start "OCR Service (backend-ocr)" cmd /k "cd backend-ocr && python main.py --host 0.0.0.0"
exit /b

:START_AGENT
start "AI Chat Agent (Agent1)" cmd /k "cd Agent1 && uvicorn api.app:app --host 0.0.0.0 --port 8010 --reload"
exit /b

:START_LIB
start "Library Service (backend-lib)" cmd /k "cd backend-lib && uvicorn main:app --host 0.0.0.0 --port 8002 --reload"
exit /b

:START_SCANNER
start "Mobile Scanner HTTPS" cmd /k "cd backend-lib && python mobile_scanner_server.py"
exit /b

:START_VBOARD
start "VBoard HTTPS" cmd /k "cd backend-lib && python vboard_server.py"
exit /b

:KILL_PORT
set port=%1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%port% ^| findstr LISTENING 2^>nul') do taskkill /F /PID %%a 2>nul
exit /b

