@echo off
REM chcp 65001
chcp 932
REM cd/d D:\USB\cgi-bin\program\comic

CD "%~n0"
REM It's often too slow, so trying to execute parallelly.
FORFILES /M *.js /C "cmd.exe /c if @isdir==FALSE START node @file l=list.txt || PAUSE"
CD ..
