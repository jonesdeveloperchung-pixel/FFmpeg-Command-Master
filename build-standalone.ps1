# FFmpeg Command Master - Standalone Build Script (PowerShell)
param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("win", "mac", "linux", "all")]
    $Platform = "win"
)

Write-Host ">>> Starting Build Process..." -ForegroundColor Cyan

# Prevent EPERM errors by stopping any running instances
Write-Host ">>> Checking for running instances to prevent file locking..." -ForegroundColor Gray
Get-Process "FFmpeg Command Master" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process "electron" -ErrorAction SilentlyContinue | Stop-Process -Force

$ProjectDir = "ffmpeg-command-architect"

# Enter the directory
Push-Location $ProjectDir

# Clean dist folder
if (Test-Path "dist") {
    Write-Host ">>> Cleaning previous builds..."
    Remove-Item -Recurse -Force "dist"
}

# Install / Rebuild native modules
Write-Host ">>> Ensuring native modules are ready..." -ForegroundColor Yellow
npm run rebuild

Write-Host ">>> Building for $Platform..." -ForegroundColor Green

switch ($Platform) {
    "win"   { npm run build:win }
    "mac"   { npm run build:mac }
    "linux" { npm run build:linux }
    "all"   { npm run build:all }
}

Pop-Location

Write-Host ">>> Build Completed! Check the '$ProjectDir/dist' folder." -ForegroundColor Cyan