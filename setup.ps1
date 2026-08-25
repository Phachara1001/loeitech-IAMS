Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "     LOEITECH-IAMS Project Setup Script      " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Installing Backend Dependencies..." -ForegroundColor Yellow
cd backend
npm install

if (-not (Test-Path .env)) {
    Write-Host "⚠️ Warning: No .env file found in backend directory!" -ForegroundColor Red
    Write-Host "Please make sure to create .env file with DATABASE_URL before running the app." -ForegroundColor Red
}

Write-Host "`n[2/4] Setting up Database (Prisma)..." -ForegroundColor Yellow
npx prisma generate
npx prisma db push
# uncomment the line below if you have a seed script setup
# npx prisma db seed

cd ..

Write-Host "`n[3/4] Installing Frontend Dependencies..." -ForegroundColor Yellow
cd frontend
npm install
cd ..

Write-Host "`n[4/4] Setup Complete! 🎉" -ForegroundColor Green
Write-Host "You can now run '.\run-dev.ps1' to start the application." -ForegroundColor Cyan
