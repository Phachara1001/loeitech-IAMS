Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "       Starting LOEITECH-IAMS Project        " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd docker; docker compose up"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run prisma:studio"
Write-Host "All services started!" -ForegroundColor Green
