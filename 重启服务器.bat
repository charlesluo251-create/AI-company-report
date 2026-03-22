@echo off
chcp 65001 > nul
echo.
echo 正在关闭旧的服务器进程...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo ╔════════════════════════════════════════╗
echo ║   帮我吧 - 客户情报报告 Bot (后端版)   ║
echo ╚════════════════════════════════════════╝
echo.
echo 正在启动后端服务器...
echo.
echo ==============================================
echo.
echo 注意：请保持这个窗口不要关闭
echo 关闭窗口将停止服务器
echo.
echo ==============================================
echo.

node backend.js

pause
