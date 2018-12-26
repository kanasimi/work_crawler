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

// --------------------------------------------------------------------------------------------------------------------

var is_installation_package;

// 接收訊息
require('electron').ipcMain.on('send_message', function(event, message) {
	if (!message) {
		return;
	}
	if (message === 'check-for-updates') {
		start_update(event.sender);
	} else {
		try {
			message = JSON.parse(message);
		} catch (e) {
			return;
		}

		if (message.is_installation_package)
			is_installation_package = message.is_installation_package;
	}
});

// for update
function start_update(event_sender) {
	try {
		if (is_installation_package) {
			event_sender.send('send_message_debug',
					'所執行的並非安裝包版本，因此不執行安裝包版本的升級檢查。');
			return;
		}

		event_sender.send('send_message_debug', 'Start release updating...');

		// https://github.com/iffy/electron-updater-example/blob/master/main.js
		// https://nicholaslee119.github.io/2018/01/11/electronBuilder%E5%85%A8%E5%AE%B6%E6%A1%B6%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97/
		// https://electronjs.org/docs/tutorial/updates
		// https://www.electron.build/auto-update

		// https://segmentfault.com/a/1190000012904543
		// 配置了publish才會生成latest.yml文件，用於自動更新的配置信息；
		// 打包後禁止對latest.yml文件做任何修改。
		// nsis可允許用戶自定義安裝位置、添加桌面快捷方式、安裝完成立即啟動、配置安裝圖標等。

		var updater = require("electron-updater"), autoUpdater = updater.autoUpdater;
		autoUpdater.checkForUpdatesAndNotify();

		if (false)
			autoUpdater
					.setFeedURL({
						provider : "gitlab",
						url : "https://gitlab.com/_example_repo_/-/jobs/artifacts/master/raw/dist?job=build"
					});

		autoUpdater.on('checking-for-update', function() {
			event_sender.send('send_message_log',
					'Checking for release update...');
		});
		autoUpdater.on('update-available', function(info) {
			event_sender.send('send_message_info', 'Release update available: '
					+ JSON.stringify(info));
		});
		autoUpdater.on('update-not-available', function(info) {
			event_sender.send('send_message_log',
					'Release update not available: ' + JSON.stringify(info));
		});
		autoUpdater.on('error', function(err) {
			event_sender.send('send_message_warn', 'Error in auto-updater: '
					+ err);
		});
		autoUpdater.on('download-progress', function(progressObj) {
			var log_message = "Download speed: " + progressObj.bytesPerSecond;
			log_message = log_message + ' - Downloaded ' + progressObj.percent
					+ '%';
			log_message = log_message + ' (' + progressObj.transferred + "/"
					+ progressObj.total + ')';
			progressObj.message = log_message;
			event_sender.send('send_message_debug', progressObj.log_message);
		});
		autoUpdater.on('update-downloaded', function(event, releaseNotes,
				releaseName, releaseDate, updateUrl, quitAndUpdate) {
			event_sender.send('send_message_log', 'Release update downloaded: '
					+ JSON.stringify(event));

			require('electron').ipcMain.on('start-install-now',
					function(e, arg) {
						console.log(arguments);
						console.log("開始更新");
						// some code here to handle event
						autoUpdater.quitAndInstall();
					});
		});

	} catch (e) {
		// e.g., Error: Cannot find module 'electron-updater'
		// win.webContents.send()
		event_sender.send('send_message_warn', 'Release update failed: ' + e);
	}
}
