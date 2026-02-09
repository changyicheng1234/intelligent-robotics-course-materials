# 解决 Git 合并冲突脚本
Write-Host "=== 检查 Git 状态 ===" -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "=== 检查是否有冲突标记 ===" -ForegroundColor Cyan
$hasConflict = $false
Get-Content "README.md" | ForEach-Object {
    if ($_ -match "^<<<<<<<|^=======|^>>>>>>>") {
        $hasConflict = $true
    }
}

if ($hasConflict) {
    Write-Host "发现冲突标记！请先手动解决 README.md 中的冲突" -ForegroundColor Red
    exit 1
}
Write-Host "README.md 中没有冲突标记" -ForegroundColor Green

Write-Host ""
Write-Host "=== 添加 README.md 到暂存区 ===" -ForegroundColor Cyan
git add README.md
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误：添加文件失败" -ForegroundColor Red
    exit 1
}
Write-Host "文件已添加到暂存区" -ForegroundColor Green

Write-Host ""
Write-Host "=== 检查是否还有其他冲突文件 ===" -ForegroundColor Cyan
$unmerged = git ls-files -u 2>&1
if ($unmerged -and $unmerged.Count -gt 0) {
    Write-Host "警告：还有未解决的文件：" -ForegroundColor Yellow
    git ls-files -u | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
    Write-Host "请先解决这些文件的冲突" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== 完成合并提交 ===" -ForegroundColor Cyan
git commit -m "解决合并冲突"
if ($LASTEXITCODE -ne 0) {
    Write-Host "警告：提交可能失败，检查是否有其他问题" -ForegroundColor Yellow
    git status
} else {
    Write-Host "合并提交完成" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== 当前状态 ===" -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "=== 下一步 ===" -ForegroundColor Cyan
Write-Host "如果合并已完成，执行以下命令推送到远程：" -ForegroundColor Yellow
Write-Host "  git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "如果遇到网络问题，可以尝试配置代理或使用 SSH" -ForegroundColor Yellow
