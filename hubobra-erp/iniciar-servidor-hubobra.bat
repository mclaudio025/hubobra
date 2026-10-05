@echo off
title HubObra ERP - Servidor Central da Loja
color 0A
cls
echo ================================================================
echo           HUBOBRA ERP - SERVIDOR LOCAL CENTRAL DA LOJA
echo ================================================================
echo.
echo [1/3] Identificando o IP deste Servidor na rede local...
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0.*0.0.0.0 ^| findstr /v "Default"') do (
    set LOCAL_IP=%%a
)
ipconfig | findstr /i "IPv4"
echo.
echo ================================================================
echo  ATENCAO: Anote o IP acima para acessar nas maquinas escravas!
echo  Exemplo de acesso nas maquinas escravas:
echo  http://localhost:3005 ou http://SEU_IP:3005
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
echo [3/3] Iniciando Servidor HTTP na porta 3005...
echo Servidor online! Deixe esta janela aberta.
echo.
call npx serve -s dist -l 3005
pause
