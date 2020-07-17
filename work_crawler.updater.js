/**
 * CeJS 網路小說漫畫下載工具 命令列介面自動更新工具。
 * 
 * @since 2018/8/27
 * 
 * @see _build/pack_up.js
 */

'use strict';

var repository = 'gh-updater', branch = 'master', update_script_url = 'https://raw.githubusercontent.com/kanasimi/'
		+ repository + '/' + branch + '/' + 'GitHub.updater.node.js', updater;

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
		throw e;
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

download_update_tool(update_script_url, function(update_script_name) {
	update_CeJS(update_script_name, update_finished);
});

var latest_version_file, executing_at_tool_directory;
function update_CeJS(update_script_name, callback) {
	executing_at_tool_directory = node_fs.existsSync('work_crawler_loader.js');
	// require('./gh-updater');
	updater = require('./' + update_script_name);

	show_info('下載並更新 CeJS 網路小說漫畫下載工具...');
	updater.update('kanasimi/work_crawler', executing_at_tool_directory
	// 解開到當前目錄下。
	? '.' : '', function(version_data) {
		latest_version_file = version_data.latest_version_file;

		if (executing_at_tool_directory) {
			// console.log('似乎在 CeJS 網路小說漫畫下載工具的工作目錄下，直接執行升級工具。');
			// console.log(process.cwd());
		} else {
			process.chdir('work_crawler-master');
		}

		show_info('下載並更新 Colorless echo JavaScript kit (CeJS) 組件...');
		updater.update(null, null, function() {
			update_dependencies();
			callback();
		}, {
			fetch_opencc : true
		});
	});
}

function update_dependencies() {
	var package_data = JSON.parse(node_fs.readFileSync('package.json'));

	// 配置圖形使用者介面。
	updater.update_package('electron', {
		message : '下載並更新圖形介面需要用到的組件 electron...',
		development : true,
		// 當 electron 正執行時，npm install, npm update
		// 會出現 EBUSY: resource busy or locked 的問題。
		skip_installed : true
	});

	// update other dependent components listed in package_data.dependencies
	for ( var package_name in package_data.dependencies) {
		if (package_name === 'cejs') {
			// 已在 update_CeJS() 安裝過了。
			continue;
		}
		// npm install electron-builder
		updater.update_package(package_name);
	}

	node_fs.chmodSync('start_gui_electron.sh', '0755');
	if (!executing_at_tool_directory) {
		// 避免第一次執行時檢查更新。
		node_fs.copyFileSync('../' + latest_version_file, latest_version_file);
	}
}

function update_finished() {
	show_info('CeJS 網路小說漫畫下載工具 更新完畢.');
}
