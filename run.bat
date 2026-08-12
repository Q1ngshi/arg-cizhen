@echo off
chcp 65001 >nul
echo ============================================
echo   慈恩镇档案管理办公室 - 本地启动器
echo ============================================
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [错误] 未检测到 Node.js。
  echo 请先到 https://nodejs.org 下载安装（一路下一步），再重新双击本文件。
  pause
  exit /b 1
)
echo 正在启动服务器（不要关闭本窗口）...
start "" http://localhost:8081/desktop.html
node serve.js
pause
