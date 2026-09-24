# Build script for cPanel / Plus Host
$ErrorActionPreference = "Stop"

$rootDir = $PSScriptRoot
if (-not $rootDir) { $rootDir = Get-Location }

Write-Host "🚀 Starting Build Process for Plus Host..."
Write-Host "📂 Root Directory: $rootDir"

# 1. Build Backend
Write-Host "📦 Building Backend (NestJS)..."
Set-Location "$rootDir\backend-nestjs"
npm install
npm run build

Write-Host "🗜️ Zipping Backend..."
$backendZipPath = "$rootDir\backend_plushost.zip"
if (Test-Path $backendZipPath) { Remove-Item $backendZipPath -Force }
Compress-Archive -Path "dist", "prisma", "package.json", "package-lock.json", "app.js" -DestinationPath $backendZipPath
Write-Host "✅ Backend Zip ready: backend_plushost.zip"

# 2. Build Frontend
Write-Host "📦 Building Frontend (Next.js)..."
Set-Location "$rootDir\frontend"
npm install
npm run build

Write-Host "🗜️ Preparing Frontend Standalone Files..."
$frontendZipPath = "$rootDir\frontend_plushost.zip"
if (Test-Path $frontendZipPath) { Remove-Item $frontendZipPath -Force }

# Copy public and static files into the standalone folder
$standaloneDir = "$rootDir\frontend\.next\standalone"
$publicDir = "$rootDir\frontend\public"
$staticDir = "$rootDir\frontend\.next\static"

if (Test-Path $publicDir) { Copy-Item -Path $publicDir -Destination "$standaloneDir\public" -Recurse -Force }
if (Test-Path $staticDir) { 
    $destStatic = "$standaloneDir\.next\static"
    if (-not (Test-Path $destStatic)) { New-Item -ItemType Directory -Path $destStatic -Force }
    Copy-Item -Path "$staticDir\*" -Destination $destStatic -Recurse -Force 
}

Write-Host "🗜️ Zipping Frontend..."
Set-Location $standaloneDir
Compress-Archive -Path "*" -DestinationPath $frontendZipPath
Set-Location $rootDir
Write-Host "✅ Frontend Zip ready: frontend_plushost.zip"

Write-Host "🎉 Process Summary: Check PLUSHOST_DEPLOY_GUIDE.md for next steps!"
