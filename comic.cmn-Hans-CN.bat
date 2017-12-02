@echo off
REM chcp 65001
chcp 936
REM cd/d D:\USB\cgi-bin\program\comic

CD "%~n0"
FORFILES /M *.js /C "cmd.exe /c IF @isdir==FALSE node @file l=@fname.txt || PAUSE"
CD ..
