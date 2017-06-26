@echo off
REM chcp 65001
chcp 932
REM cd/d D:\USB\cgi-bin\program\comic

CD "%~n0"
FORFILES /M *.js /C "cmd /c if @isdir==FALSE node @file l=@fname.txt || pause"
CD ..
