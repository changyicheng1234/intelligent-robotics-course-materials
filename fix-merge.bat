@echo off
chcp 65001 >nul
echo === 检查 Git 状态 ===
git status

echo.
echo === 添加 README.md 到暂存区 ===
git add README.md
if errorlevel 1 (
    echo 错误：添加文件失败
    pause
    exit /b 1
)
echo 文件已添加到暂存区

echo.
echo === 完成合并提交 ===
git commit -m "解决合并冲突"
if errorlevel 1 (
    echo 警告：提交可能失败，检查是否有其他问题
    git status
    pause
    exit /b 1
)
echo 合并提交完成

echo.
echo === 当前状态 ===
git status

echo.
echo === 下一步 ===
echo 如果合并已完成，执行以下命令推送到远程：
echo   git push -u origin main
echo.
pause
