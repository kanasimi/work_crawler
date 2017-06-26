@echo off
REM chcp 65001
chcp 932
REM cd/d D:\USB\cgi-bin\program\comic
node "%~n0.js" "l=%~n0.txt" || pause
