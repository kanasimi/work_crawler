@ECHO OFF
REM serial
REM chcp 65001
chcp 932
REM cd/d D:\USB\cgi-bin\program\comic

REM CD "%~n0"
FORFILES /M *.js /C "cmd.exe /c if @isdir==FALSE node @file l=@fname.txt || PAUSE"
REM CD ..
