@echo off
chcp 65001 >nul
echo.
echo ===============================================
echo           🏪 LOJA MODERNA - AUTO START
echo ===============================================
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado! Por favor, instale o Node.js primeiro.
    echo 📥 Download: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se npm está disponível
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ NPM não encontrado! Verifique a instalação do Node.js.
    pause
    exit /b 1
)

echo ✅ Node.js e NPM encontrados!
echo.
echo 🚀 Iniciando sistema...
echo.

REM Executar o script de inicialização
node start-auto.js

REM Se chegou aqui, o script foi interrompido
echo.
echo 👋 Sistema encerrado.
pause