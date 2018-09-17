/**
 * @see https://github.com/electron/electron/blob/master/docs/tutorial/quick-start.md
 *      https://medium.com/how-to-electron/a-complete-guide-to-packaging-your-electron-app-1bdc717d739f
 */

// const
var app = require('electron').app, BrowserWindow = require('electron').BrowserWindow, path = require('path'), url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
// let win
var win;

function create_window() {
	// Create the browser window.
	// https://electronjs.org/docs/api/browser-window
	win = new BrowserWindow(Object.assign({
		// https://github.com/electron-userland/electron-builder/issues/2269#issuecomment-342168989
		// Mac OS icon: at least 512x512
		icon : path.join(__dirname, '/icon/rasen2.png')
	},
	// https://github.com/electron/electron/blob/master/docs/api/screen.md
	require('electron').screen.getPrimaryDisplay().workAreaSize));

	// https://electronjs.org/docs/api/browser-window
	win.maximize();

	// and load the gui_electron.html of the app.
	win.loadURL(url.format({
		pathname : path.join(__dirname, 'gui_electron.html'),
		protocol : 'file:',
		slashes : true
	}));

	if (false)
		// https://electronjs.org/docs/api/web-contents#contentssendchannel-arg1-arg2-
		win.webContents.on('did-finish-load', function() {
			win.webContents.send('send_message', 'message');
		});

	require('electron').ipcMain.on('set_progress', function(event, progress) {
		// https://electronjs.org/docs/tutorial/progress-bar
		// progress indicator:
		// https://docs.microsoft.com/en-us/dotnet/api/system.windows.shell.taskbariteminfo.progressvalue
		win.setProgressBar(progress);
	});

	require('electron').ipcMain.on('open_DevTools', function(event, open) {
		if (open)
			// Open the DevTools.
			win.webContents.openDevTools();
	});

	// Emitted when the window is closed.
	win.on('closed', function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null;
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', create_window);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function() {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		create_window();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

try {
	// https://github.com/iffy/electron-updater-example/blob/master/main.js
	// https://nicholaslee119.github.io/2018/01/11/electronBuilder%E5%85%A8%E5%AE%B6%E6%A1%B6%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97/
	var updater = require("electron-updater"), autoUpdater = updater.autoUpdater;
	if (false)
		autoUpdater
				.setFeedURL({
					provider : "gitlab",
					url : "https://gitlab.com/_example_repo_/-/jobs/artifacts/master/raw/dist?job=build"
				});

	autoUpdater.on('update-available', function(info) {
		console.log('Update available.');
	});
} catch (e) {
	console.error(e);
}
