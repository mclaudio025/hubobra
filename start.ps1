# Script PowerShell para inicialização automática da Loja Moderna
# Encoding: UTF-8

# Configurar encoding para UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Função para escrever texto colorido
function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

# Função para verificar se um comando existe
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Cabeçalho
Clear-Host
Write-Host ""
Write-ColorText "===============================================" "Cyan"
Write-ColorText "           🏪 LOJA MODERNA - AUTO START" "Yellow"
Write-ColorText "===============================================" "Cyan"
Write-Host ""

try {
    # Verificar Node.js
    Write-ColorText "🔍 Verificando Node.js..." "Blue"
    if (-not (Test-Command "node")) {
        Write-ColorText "❌ Node.js não encontrado!" "Red"
        Write-ColorText "📥 Por favor, instale o Node.js: https://nodejs.org/" "Yellow"
        Read-Host "Pressione Enter para sair"
        exit 1
    }
    
    $nodeVersion = node --version
    Write-ColorText "✅ Node.js encontrado: $nodeVersion" "Green"
    
    # Verificar NPM
    Write-ColorText "🔍 Verificando NPM..." "Blue"
    if (-not (Test-Command "npm")) {
        Write-ColorText "❌ NPM não encontrado!" "Red"
        Write-ColorText "⚠️  Verifique a instalação do Node.js" "Yellow"
        Read-Host "Pressione Enter para sair"
        exit 1
    }
    
    $npmVersion = npm --version
    Write-ColorText "✅ NPM encontrado: $npmVersion" "Green"
    
    Write-Host ""
    Write-ColorText "🚀 Iniciando sistema..." "Magenta"
    Write-Host ""
    
    # Verificar se o script de inicialização existe
    $scriptPath = Join-Path $PSScriptRoot "start-auto.js"
    if (-not (Test-Path $scriptPath)) {
        Write-ColorText "❌ Script de inicialização não encontrado: $scriptPath" "Red"
        Read-Host "Pressione Enter para sair"
        exit 1
    }
    
    # Executar o script Node.js
    & node $scriptPath
    
}
catch {
    Write-ColorText "❌ Erro durante a execução: $($_.Exception.Message)" "Red"
    Read-Host "Pressione Enter para sair"
    exit 1
}
finally {
    Write-Host ""
    Write-ColorText "👋 Sistema encerrado." "Yellow"
    Read-Host "Pressione Enter para sair"
}