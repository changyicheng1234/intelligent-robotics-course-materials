Write-Host "Checking Git status..." -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "Adding README.md..." -ForegroundColor Cyan
git add README.md

Write-Host ""
Write-Host "Completing merge commit..." -ForegroundColor Cyan
git commit -m "Resolve merge conflict"

Write-Host ""
Write-Host "Current status:" -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "Next step: git push -u origin main" -ForegroundColor Yellow
