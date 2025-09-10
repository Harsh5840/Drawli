# PowerShell build script for Windows

# Stop on error
$ErrorActionPreference = "Stop"

# Change to the project directory
Set-Location -Path "d:\board\drawli"

# Build all packages first
Write-Host "Building shared packages..."
pnpm install
pnpm -r --filter "./packages/*" build

# Build http-backend
Write-Host "Building http-backend..."
docker build -t harshshukla031/http-backend:latest -f apps/http-backend/Dockerfile .

# Build ws-backend
Write-Host "Building ws-backend..."
docker build -t harshshukla031/ws-backend:latest -f apps/ws-backend/Dockerfile .

# Build drawli-front
Write-Host "Building drawli-front..."
docker build -t harshshukla031/drawli-front:latest -f apps/drawli-front/Dockerfile .

Write-Host "`nAll services built successfully!"
Write-Host "`nTo run the services, use:"
Write-Host "docker-compose -f docker-compose.prod.yml up -d"
