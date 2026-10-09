; ==============================================================================
; HUBOBRA ERP - SCRIPT DE COMPILACAO DO INSTALADOR WINDOWS (INNO SETUP)
; ==============================================================================
; Este script gera o executavel "Setup-HubObra-ERP.exe" que instala tanto o
; SERVIDOR CENTRAL DA LOJA (com SQLite + WebSockets) quanto as 12 ESTACOES.
; ==============================================================================

#define MyAppName "HubObra ERP"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "HubObra Tecnologia"
#define MyAppURL "https://hubobra.com.br"
#define MyAppExeName "iniciar-servidor-hubobra.bat"

[Setup]
AppId={{9F82A4C1-28B1-4A59-86BC-95DA8CF14912}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\HubObra ERP
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=..\dist-installer
OutputBaseFilename=Setup-HubObra-ERP-v1.0.0
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64
SetupIconFile=app.ico

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Types]
Name: "full"; Description: "Instalacao Completa"
Name: "custom"; Description: "Personalizada"; Flags: iscustom

[Components]
Name: "server"; Description: "Servidor Central da Loja (Master - Banco SQLite e WebSockets)"; Types: full custom; Flags: checkablealone
Name: "terminal"; Description: "Atalho para Terminal de Trabalho (Balcao, Caixa, Expedicao)"; Types: full custom

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na Area de Trabalho"; GroupDescription: "Atalhos:"
Name: "autostart"; Description: "Iniciar automaticamente ao ligar o Windows (Apenas Servidor)"; GroupDescription: "Inicializacao:"; Components: server

[Files]
; Arquivos do Servidor e Frontend Compilado
Source: "..\dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs; Components: server
Source: "..\server\*"; DestDir: "{app}\server"; Flags: ignoreversion recursesubdirs createallsubdirs; Components: server
Source: "..\iniciar-servidor-hubobra.bat"; DestDir: "{app}"; Flags: ignoreversion; Components: server
Source: "app.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; Atalho do Servidor Central
Name: "{autoprograms}\{#MyAppName} - Servidor Central"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app.ico"; Components: server
Name: "{autodesktop}\{#MyAppName} - Servidor Central"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app.ico"; Tasks: desktopicon; Components: server
Name: "{commonstartup}\{#MyAppName} - Servidor"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app.ico"; Tasks: autostart; Components: server

[Run]
; Regra de Firewall do Windows para permitir acesso dos 12 terminais na porta 3005
Filename: "netsh"; Parameters: "advfirewall firewall add rule name=""HubObra ERP Porta 3005"" dir=in action=allow protocol=TCP localport=3005"; Flags: runhidden; Components: server

[Code]
var
  ServerPage: TInputQueryWizardPage;
  ServerIP: String;

procedure InitializeWizard;
begin
  // Pagina para perguntar o IP do Servidor se instalar como Terminal
  ServerPage := CreateInputQueryPage(wpSelectComponents,
    'Configuracao de Conexao da Rede',
    'Identifique o computador Servidor da Loja',
    'Digite o Endereco IP do Servidor Central (ex: 192.168.1.100 ou 192.168.0.50):');
  ServerPage.Add('IP do Servidor:', False);
  ServerPage.Values[0] := '192.168.1.100';
end;

function ShouldSkipPage(PageID: Integer): Boolean;
begin
  // So exibe a pagina de IP se o usuario selecionou "terminal"
  if PageID = ServerPage.ID then
    Result := not WizardIsComponentSelected('terminal')
  else
    Result := False;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  TargetUrl: String;
  ShortcutScript: String;
  DesktopPath: String;
begin
  if (CurStep = ssPostInstall) and WizardIsComponentSelected('terminal') then
  begin
    ServerIP := Trim(ServerPage.Values[0]);
    if ServerIP = '' then
      ServerIP := 'localhost';
      
    TargetUrl := 'http://' + ServerIP + ':3005';
    DesktopPath := ExpandConstant('{autodesktop}');
    
    // Cria atalho em modo App (Chrome/Edge sem barra de URL)
    ShortcutScript := 
      'Set oWS = WScript.CreateObject("WScript.Shell")' + #13#10 +
      'sLinkFile = "' + DesktopPath + '\HubObra ERP - Terminal.lnk"' + #13#10 +
      'Set oLink = oWS.CreateShortcut(sLinkFile)' + #13#10 +
      'If oWS.Environment("Process")("PROCESSOR_ARCHITECTURE") = "AMD64" Then' + #13#10 +
      '  ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"' + #13#10 +
      'Else' + #13#10 +
      '  ChromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"' + #13#10 +
      'End If' + #13#10 +
      'Set fso = CreateObject("Scripting.FileSystemObject")' + #13#10 +
      'If fso.FileExists(ChromePath) Then' + #13#10 +
      '  oLink.TargetPath = ChromePath' + #13#10 +
      '  oLink.Arguments = "--app=' + TargetUrl + ' --start-maximized"' + #13#10 +
      'Else' + #13#10 +
      '  oLink.TargetPath = "' + TargetUrl + '"' + #13#10 +
      'End If' + #13#10 +
      'oLink.Description = "Sistema HubObra ERP - Terminal de Venda e Caixa"' + #13#10 +
      'oLink.Save';

    SaveStringToFile(ExpandConstant('{tmp}\create_terminal_shortcut.vbs'), ShortcutScript, False);
    Exec('cscript.exe', ExpandConstant('//nologo "{tmp}\create_terminal_shortcut.vbs"'), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;
