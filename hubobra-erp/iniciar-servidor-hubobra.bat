@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title HubObra ERP - Servidor Central da Loja
color 0A
cls

echo ================================================================
echo           HUBOBRA ERP - SERVIDOR LOCAL CENTRAL DA LOJA
echo ================================================================
echo.

:: 1. Verificacao e deteccao inteligente do Node.js
where node >nul 2>&1
if not errorlevel 1 goto NODE_OK

if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
    goto NODE_OK
)
if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
    goto NODE_OK
)
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    goto NODE_OK
)

color 0C
echo ================================================================
echo  [ERRO] O Node.js NAO foi detectado neste computador!
echo ================================================================
echo  O Servidor Central precisa do Node.js LTS para executar o banco e a API.
echo.
echo  COMO RESOLVER:
echo  1. Baixe o Node.js LTS no site oficial: https://nodejs.org
echo  2. Avance a instalacao ate o fim mantendo "Add to PATH" marcada.
echo  3. Feche todas as janelas pretas e execute este arquivo novamente.
echo ================================================================
pause
exit /b 1

:NODE_OK
echo [1/3] Identificando o IP deste Servidor na rede local...
set "LOCAL_IP=localhost"
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0.*0.0.0.0 ^| findstr /v "Default"') do (
    set "LOCAL_IP=%%a"
)
ipconfig | findstr /i "IPv4"
echo.
echo ================================================================
echo  ATENCAO: Anote o IP acima para acessar nas maquinas da loja!
echo  Exemplo de acesso nas maquinas escravas:
echo  http://localhost:3005 ou http://%LOCAL_IP%:3005
echo ================================================================
echo.

echo [2/3] Verificando arquivos de producao (dist)...
if not exist "dist\index.html" (
    echo Compilando versao de producao otimizada...
    call npm run build
) else (
    echo [OK] Pasta dist pronta e otimizada!
)

echo.
echo [3/3] Iniciando Servidor Central Local (API + SQLite + WebSockets na porta 3005)...
if not exist "server\node_modules\ws" (
    echo Instalando dependencias do servidor local...
    pushd server
    call npm install
    popd
)

echo.
echo Iniciando processo do servidor...
call node server/index.js
if errorlevel 1 (
    echo.
    echo [ERRO] O servidor foi encerrado inesperadamente.
    pause
)
