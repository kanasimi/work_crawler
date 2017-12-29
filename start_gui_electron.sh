# https://electronjs.org/
# npm install electron

# npm install electron-builder
# for electron-builder:
# NG: npm install nsis
#
# npm run-script dist
# %HOMEPATH%\node_modules\.bin\electron-builder --linux
# node_modules\.bin\electron-builder --win --ia32 --x64
# node_modules\.bin\electron-builder -wl
# node_modules\.bin\electron-builder --linux --x64
# node_modules\.bin\electron-builder --linux=AppImage --x64
# node_modules/.bin/electron-builder --dir
#
# https://www.electron.build/configuration/configuration
# https://newsn.net/say/electron-builder-basic.html
# https://electron.org.cn/builder//configuration/configuration.html#configuration
# http://www.eikospartners.com/blog/electron-create-a-single-app-for-windows-linux-and-mac
# https://www.electron.build/configuration/nsis
# https://www.electron.build/configuration/linux#appimageoptions


# npm install electron-packager

node_modules/.bin/electron . || ~/node_modules/.bin/electron .
# start_gui_electron.bat
#node_modules\.bin\electron . || %HOMEPATH%\node_modules\.bin\electron .


# node_modules/.bin/build --prepackaged .
