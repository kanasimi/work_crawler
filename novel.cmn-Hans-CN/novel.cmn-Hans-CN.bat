@ECHO OFF
CHCP 65001
REM CHCP 950
REM CD /D D:\USB\cgi-bin\program\comic

REM CD "%~n0"
REM It's often too slow, so trying to execute parallelly.
REM + modify_work_list_when_archive_old_works
FORFILES /M *.js /C "cmd.exe /c IF @isdir==FALSE START node @file l=list.txt || PAUSE"

REM node ck101.js l=ck101.txt
node kanunu.js l=kanunu.txt
REM CD ..
