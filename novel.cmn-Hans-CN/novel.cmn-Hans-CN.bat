@ECHO OFF
REM chcp 65001
REM chcp 936
REM cd/d D:\USB\cgi-bin\program\comic

REM CD "%~n0"
REM It's often too slow, so trying to execute parallelly.
FORFILES /M *.js /C "cmd.exe /c IF @isdir==FALSE START node @file l=list.txt || PAUSE"

chcp 950
node ck101.js l=ck101.txt
REM CD ..
