@echo off
chcp 65001 >nul
echo 正在完成合并提交...
echo.

echo 1. 添加 README.md 到暂存区...
git add README.md
if %errorlevel% neq 0 (
    echo 错误：添加文件失败
    pause
    exit /b 1
)

echo.
echo 2. 检查是否还有其他未解决的文件...
git status

echo.
echo 3. 完成合并提交...
git commit -m "解决合并冲突"
if %errorlevel% neq 0 (
    echo 警告：提交可能失败，请检查是否有其他冲突
    pause
    exit /b 1
)

echo.
echo 4. 合并完成！现在可以推送到远程仓库了
echo    执行: git push -u origin main
echo.
pause
