Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "       Updating Database Schema (Prisma)     " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

cd backend

Write-Host "[1/2] Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "`n[2/2] Pushing schema changes to the database..." -ForegroundColor Yellow
npx prisma db push

cd ..

Write-Host "`nDatabase Update Complete! " -ForegroundColor Green
