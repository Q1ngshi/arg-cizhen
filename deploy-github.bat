@echo off
chcp 65001 >nul
REM ============================================
REM  慈恩镇 ARG - 一键部署到 GitHub Pages
REM  前提：已安装 Git for Windows
REM ============================================
cd /d "%~dp0"

echo [1/5] 检查 git 身份...
git config user.name  >nul 2>&1 || git config user.name "wangyujie"
git config user.email >nul 2>&1 || git config user.email "wangyujie@users.noreply.github.com"

echo [2/5] 提交代码...
git add -A
git commit -m "慈恩镇 ARG v1.0 上桌版：官网伪装 + 双密码门解密链 + 合规标识" >nul 2>&1 && echo   完成

echo [3/5] 设置远端仓库...
git remote remove origin 2>nul
set /p GH_USER=请输入你的 GitHub 用户名:
git remote add origin https://github.com/%GH_USER%/arg-cizhen.git

echo [4/5] 推送代码（首次会弹出 GitHub 登录窗口，在浏览器完成登录即可）...
git push -u origin main
if errorlevel 1 (
  echo.
  echo 推送失败。常见原因：
  echo   1. 还没在 GitHub 网页创建仓库  - 请先打开 https://github.com/new 创建 arg-cizhen 仓库（Public）再重跑本脚本
  echo   2. 登录未完成 - 重跑本脚本，在弹出窗口里登录
  pause
  exit /b 1
)

echo [5/5] 打开 Pages 设置页（选择 main 分支，Save，等 1 分钟）...
start https://github.com/%GH_USER%/arg-cizhen/settings/pages

echo.
echo 部署完成后访问: https://%GH_USER%.github.io/arg-cizhen/
echo.
pause
