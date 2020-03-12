/**
 * @name CeJS 網路小說漫畫下載工具 命令列介面自動產生新安裝包工具。
 * 
 * @fileoverview You may using this tool to generate executable packages.
 * 
 * TODO: 部署至 GitHub
 * 
 * @since 2018/9/9 20:54:21 <code>

2020/3/8 8:26:20 @ macOS v10.13.2 "High Sierra"
electron-builder@22.3.2	可執行安裝程序
electron-builder@22.3.6, 2.4.0	SIGILL

</code>
 * 
 * @see work_crawler.updater.js
 */

'use strict';

var change_to_version;
// change_to_version = 'v2.1.0';

var repository = 'work_crawler', branch = 'master', update_script_url = 'https://raw.githubusercontent.com/kanasimi/'
		+ repository + '/' + branch + '/' + repository + '.updater.js';

// ----------------------------------------------------------------------------
// Using in GitHub.updater.node.js work_crawler.updater.js pack_up.js

function show_info(message) {
	process.title = message;
	console.info('\x1b[35;46m' + message + '\x1b[0m');
}

// ----------------------------------------------------------------------------
// Using in work_crawler.updater.js pack_up.js

// const
var node_https = require('https'), node_fs = require('fs');

function fetch_url(url, callback) {
	node_https.get(url, function(response) {
		var buffer_array = [], sum_size = 0;

		response.on('data', function(data) {
			sum_size += data.length;
			buffer_array.push(data);
		});

		response.on('end', function(e) {
			var contents = Buffer.concat(buffer_array, sum_size).toString(),
			//
			file_name = url.match(/[^\\\/]+$/)[0];
			console.info(file_name + ': ' + sum_size + ' bytes.');
			try {
				node_fs.writeFileSync(file_name, contents);
			} catch (e) {
				// e.g., read-only. testing now?
				console.error(e);
			}

			if (typeof callback === 'function')
				callback(file_name);
		});
	})
	//
	.on('error', function(e) {
		// network error?
		// console.error(e);
		// throw e;
		callback(null, e);
	});
}

function fetch_url_promise(url) {
	return new Promise(function(resolve, reject) {
		fetch_url(url, function(file_name, error) {
			if (error)
				reject(error);
			else
				resolve(file_name);
		});
	});
}

/**
 * <code>
 curl -O https://raw.githubusercontent.com/kanasimi/work_crawler/master/work_crawler.updater.js
 * </code>
 */
function download_update_tool(update_script_url, callback) {
	show_info('下載 ' + repository + ' 更新工具...');
	fetch_url(update_script_url, callback);
}

// ----------------------------------------------------------------------------

// const
var child_process = require('child_process'),
// path segment separator
path_separator = require('path').sep;

// You may need to change the working directory first.

show_info('Build package in current directory [' + process.cwd() + ']...');

download_update_tool(update_script_url, build_package);

// 遞歸刪除目錄與底下所有檔案。
function remove_directory(directory_path) {
	var is_windows = process.platform.startsWith('win');
	if (is_windows)
		directory_path = directory_path.replace(/[\\\/]/g, path_separator);

	if (!node_fs.existsSync(directory_path))
		return;

	child_process.execSync((is_windows ? 'rd /s /q' : 'rm -rf') + ' "'
			+ directory_path + '"', {
		stdio : 'inherit'
	});
}

function build_package(update_script_name) {
	var directory_name = repository + '-' + branch;
	if (node_fs.existsSync(directory_name)) {
		show_info('清理戰場...');
		// node_fs.renameSync(directory_name, directory_name + '.old');
		remove_directory(directory_name);
	}
	// clean previous cache
	try {
		node_fs.unlinkSync(repository + '-' + branch + '.version.json');
	} catch (e) {
		// TODO: handle exception
	}

	show_info('建立執行環境...');
	// node work_crawler.updater.js
	child_process.execSync('node ' + update_script_name, {
		stdio : 'inherit'
	});

	node_fs.renameSync(directory_name + '.version.json', directory_name
			+ path_separator + directory_name + '.version.json');

	// 因為更換了目錄，無法採用 chdir() 後 `require('gh-updater')`。
	// update_script_url 會下載一份 GitHub.updater.node.js 放在當前目錄中。
	var updater = require('./GitHub.updater.node.js');

	// cd work_crawler-master
	process.chdir(directory_name);
	// node_fs.mkdirSync('node_modules');

	var package_data = JSON.parse(node_fs.readFileSync('package.json'));

	for ( var package_name in package_data.devDependencies) {
		if (package_name in package_data.dependencies) {
			// package_data.dependencies 裡面的應已在建立執行環境時安裝過了。
			continue;
		}
		// npm install electron-builder
		updater.update_package(package_name, true);
	}

	remove_directory('node_modules/cejs');

	// mv CeJS-master node_modules/cejs
	node_fs.renameSync('CeJS-master', 'node_modules' + path_separator + 'cejs');

	if (change_to_version && package_data.version != change_to_version) {
		show_info('手動指定/改變打包的版本: ' + package_data.version + ' → '
				+ change_to_version);
		package_data.version = String(change_to_version);
		node_fs.writeFileSync('package.json', JSON.stringify(package_data));
	}

	show_info('開始打包 ' + package_data.version + '...');
	// electron打包太慢解決方法
	// https://electronjs.org/docs/tutorial/installation#快取
	// https://github.com/electron/electron/releases
	child_process.execSync('npm run-script dist', {
		stdio : 'inherit'
	});

	var is_windows = process.platform.startsWith('win');
	if (is_windows) {
		console.warn('Windows版 2019/7/20 建構時需要改檔名。請確認檔名和 latest.yml 裡面的相符合。');
	}

	// cd build
	// ls -al
}
