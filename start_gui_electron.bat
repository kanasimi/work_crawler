@ECHO OFF

echo Loading work_crawler GUI...

node_modules\.bin\electron . 2> nul || %USERPROFILE%\node_modules\.bin\electron . || ECHO Please install electron first! && PAUSE
