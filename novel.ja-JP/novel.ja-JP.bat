@ECHO OFF
REM parallelly
CHCP 65001
REM CHCP 932
REM CD /D D:\USB\cgi-bin\program\comic

REM CD "%~n0"
REM It's often too slow, so trying to execute parallelly.
FORFILES /M *.js /C "cmd.exe /c IF @isdir==FALSE START node @file l=@fname.txt || PAUSE"

REM CD ..
