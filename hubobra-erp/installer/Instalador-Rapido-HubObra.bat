@echo off
setlocal EnableDelayedExpansion
title HubObra ERP - Assistente de Instalacao da Loja
color 0B
cls

echo ================================================================
echo        HUBOBRA ERP - ASSISTENTE DE INSTALACAO (WINDOWS)
echo ================================================================
echo  Este assistente configura este computador na rede da loja.
echo.
echo  Selecione a funcao deste computador:
echo.
echo  [1] SERVIDOR CENTRAL (Master)
echo      - Apenas para 1 computador da loja (o Servidor).
echo      - Instala o Banco SQLite, WebSockets em tempo real e Spooler.
echo      - Abre a porta 3005 no Firewall do Windows automaticamente.
echo.
echo  [2] TERMINAL DE TRABALHO (Escravo)
echo      - Para os outros 12 computadores (Vendedores, Caixa, Expedicao, etc.).
echo      - Conecta ao Servidor Central pela rede local.
echo      - Cria o atalho no modo aplicativo na Area de Trabalho.
echo.
echo ================================================================
set /p MODO="Escolha a opcao [1 ou 2]: "

:: Limpa espacos na opcao
set "MODO=%MODO: =%"

if "%MODO%"=="1" goto MODO_SERVIDOR
if "%MODO%"=="2" goto MODO_TERMINAL

echo.
echo Opcao invalida. Encerrando.
pause
exit /b

:MODO_SERVIDOR
cls
color 0A
echo ================================================================
echo           CONFIGURANDO SERVIDOR CENTRAL DA LOJA
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

:: Se nao achou o Node.js:
color 0C
echo ================================================================
echo  [ERRO] O Node.js NAO foi detectado no sistema!
echo ================================================================
echo  O Servidor Central precisa do Node.js LTS instalado no Windows.
echo.
echo  COMO RESOLVER:
echo  1. Acesse: https://nodejs.org e baixe a versao LTS.
echo  2. Execute o instalador e avance ate o fim mantendo "Add to PATH".
echo  3. Feche todas as janelas pretas e execute este instalador novamente.
echo ================================================================
pause
exit /b 1

:NODE_OK
echo [1/4] Identificando o IP deste Servidor na rede local...
set "SERVER_IP=localhost"
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0.*0.0.0.0 ^| findstr /v "Default"') do (
    set "SERVER_IP=%%a"
)
ipconfig | findstr /i "IPv4"
echo.

echo [2/4] Liberando a Porta 3005 no Firewall do Windows...
netsh advfirewall firewall add rule name="HubObra ERP Porta 3005" dir=in action=allow protocol=TCP localport=3005 >nul 2>&1
echo [OK] Regra do Firewall configurada para a porta 3005!
echo.

echo [3/4] Criando atalho no Inicializar do Windows (Inicializacao Automatica)...
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SCRIPT_VBS=%TEMP%\create_server_startup.vbs"
set "ATALHO_DESTINO=%STARTUP_DIR%\HubObra Servidor Central.lnk"
set "DESKTOP_DESTINO=%USERPROFILE%\Desktop\HubObra Servidor Central.lnk"
:: Normaliza o caminho absoluto da raiz do HubObra
for %%I in ("%~dp0..") do set "ROOT_DIR=%%~fI"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SCRIPT_VBS%"
echo sLinkFile = "%ATALHO_DESTINO%" >> "%SCRIPT_VBS%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SCRIPT_VBS%"
echo oLink.TargetPath = "%ROOT_DIR%\iniciar-servidor-hubobra.bat" >> "%SCRIPT_VBS%"
echo oLink.WorkingDirectory = "%ROOT_DIR%" >> "%SCRIPT_VBS%"
echo oLink.Description = "HubObra ERP - Servidor Central da Loja" >> "%SCRIPT_VBS%"
if exist "%ROOT_DIR%\installer\app.ico" (
    echo oLink.IconLocation = "%ROOT_DIR%\installer\app.ico,0" >> "%SCRIPT_VBS%"
)
echo oLink.Save >> "%SCRIPT_VBS%"
cscript /nologo "%SCRIPT_VBS%" >nul 2>&1

:: Copia tambem para o Desktop
copy /Y "%ATALHO_DESTINO%" "%DESKTOP_DESTINO%" >nul 2>&1
del "%SCRIPT_VBS%" >nul 2>&1
echo [OK] Atalho criado no Desktop e na Inicializacao do Windows!
echo.

echo [4/4] Verificando dependencias do banco e WebSockets...
if not exist "%ROOT_DIR%\server\node_modules\ws" (
    echo Instalando modulos do servidor...
    pushd "%ROOT_DIR%\server"
    call npm install
    popd
) else (
    echo [OK] Modulos do servidor ja instalados!
)

echo.
echo ================================================================
echo   [SUCESSO] O SERVIDOR CENTRAL FOI CONFIGURADO COM SUCESSO!
echo ================================================================
echo.
echo  ANOTE O IP PARA CONFIGURAR NOS OUTROS TERMINAIS:
echo  - Endereco de Acesso na Rede: http://%SERVER_IP%:3005
echo.
echo ================================================================
set /p INICIAR="Deseja iniciar o servidor agora? [S/N]: "
if /i "%INICIAR%"=="S" (
    start "HubObra Servidor Central" /d "%ROOT_DIR%" "%ROOT_DIR%\iniciar-servidor-hubobra.bat"
)
echo.
echo Configuracao concluida. Pressione qualquer tecla para sair.
pause >nul
exit /b

:MODO_TERMINAL
cls
color 0E
echo ================================================================
echo         CONFIGURANDO TERMINAL DE TRABALHO (ESTACAO)
echo ================================================================
echo.
set /p IP_ALVO="Digite o IP do Servidor Central (ex: 192.168.0.108): "

set "IP_ALVO=%IP_ALVO: =%"
if "%IP_ALVO%"=="" set "IP_ALVO=localhost"

echo.
echo Qual setor este computador atende?
echo [1] Vendedor / Balcao
echo [2] Caixa Central
echo [3] Expedicao / Galpao
echo [4] Financeiro
echo [5] Compras
set /p SETOR="Escolha o setor [1 a 5]: "

set "NOME_SETOR=Terminal"
if "%SETOR%"=="1" set "NOME_SETOR=Balcao"
if "%SETOR%"=="2" set "NOME_SETOR=Caixa"
if "%SETOR%"=="3" set "NOME_SETOR=Expedicao"
if "%SETOR%"=="4" set "NOME_SETOR=Financeiro"
if "%SETOR%"=="5" set "NOME_SETOR=Compras"

set "URL_TERMINAL=http://%IP_ALVO%:3005"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"
set "SCRIPT_TERM_VBS=%TEMP%\create_terminal_shortcut.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SCRIPT_TERM_VBS%"
echo sLinkFile = "%DESKTOP_DIR%\HubObra ERP - %NOME_SETOR%.lnk" >> "%SCRIPT_TERM_VBS%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SCRIPT_TERM_VBS%"

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    echo oLink.TargetPath = "C:\Program Files\Google\Chrome\Application\chrome.exe" >> "%SCRIPT_TERM_VBS%"
    echo oLink.Arguments = "--app=%URL_TERMINAL% --start-maximized" >> "%SCRIPT_TERM_VBS%"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    echo oLink.TargetPath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" >> "%SCRIPT_TERM_VBS%"
    echo oLink.Arguments = "--app=%URL_TERMINAL% --start-maximized" >> "%SCRIPT_TERM_VBS%"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    echo oLink.TargetPath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" >> "%SCRIPT_TERM_VBS%"
    echo oLink.Arguments = "--app=%URL_TERMINAL% --start-maximized" >> "%SCRIPT_TERM_VBS%"
) else (
    echo oLink.TargetPath = "%URL_TERMINAL%" >> "%SCRIPT_TERM_VBS%"
)

echo oLink.Description = "HubObra ERP - %NOME_SETOR%" >> "%SCRIPT_TERM_VBS%"
if exist "%~dp0app.ico" (
    echo oLink.IconLocation = "%~dp0app.ico,0" >> "%SCRIPT_TERM_VBS%"
)
echo oLink.Save >> "%SCRIPT_TERM_VBS%"
cscript /nologo "%SCRIPT_TERM_VBS%" >nul 2>&1
del "%SCRIPT_TERM_VBS%" >nul 2>&1

echo.
echo ================================================================
echo   [SUCESSO] TERMINAL CONFIGURADO COM SUCESSO!
echo ================================================================
echo  - O icone "HubObra ERP - %NOME_SETOR%" foi criado no Desktop.
echo  - Ao clicar duas vezes, ele abrira direto em modo aplicativo
echo    conectado no Servidor Central (%IP_ALVO%:3005).
echo ================================================================
echo.
pause
exit /b
