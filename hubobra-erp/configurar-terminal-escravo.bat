@echo off
title HubObra ERP - Configurador do Terminal Escravo / Balcao
color 0B
cls
echo ================================================================
echo      HUBOBRA ERP - CRIAR ATALHO DE PDV NA MAQUINA ESCRAVA
echo ================================================================
echo.
set /p SERVER_IP="Digite o IP do Servidor (ex: 192.168.1.100 ou 192.168.0.50): "

if "%SERVER_IP%"=="" (
    set SERVER_IP=localhost
)

set URL=http://%SERVER_IP%:3005

echo.
echo Criando atalho "HubObra PDV Balcao" na Area de Trabalho...
set SCRIPT="%TEMP%\%RANDOM%-%RANDOM%.vbs"
set DESKTOP=%USERPROFILE%\Desktop

echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
echo sLinkFile = "%DESKTOP%\HubObra PDV - Loja.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    echo oLink.TargetPath = "C:\Program Files\Google\Chrome\Application\chrome.exe" >> %SCRIPT%
    echo oLink.Arguments = "--app=%URL% --start-maximized" >> %SCRIPT%
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    echo oLink.TargetPath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" >> %SCRIPT%
    echo oLink.Arguments = "--app=%URL% --start-maximized" >> %SCRIPT%
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    echo oLink.TargetPath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" >> %SCRIPT%
    echo oLink.Arguments = "--app=%URL% --start-maximized" >> %SCRIPT%
) else (
    echo oLink.TargetPath = "%URL%" >> %SCRIPT%
)

echo oLink.Description = "Sistema HubObra ERP - Frente de Caixa e Balcao" >> %SCRIPT%
if exist "%~dp0public\app.ico" (
    echo oLink.IconLocation = "%~dp0public\app.ico,0" >> %SCRIPT%
) else if exist "%~dp0installer\app.ico" (
    echo oLink.IconLocation = "%~dp0installer\app.ico,0" >> %SCRIPT%
)
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%

echo.
echo [SUCESSO] Atalho criado na sua Area de Trabalho!
echo Agora basta dar dois cliques no icone "HubObra PDV - Loja".
echo.
pause
