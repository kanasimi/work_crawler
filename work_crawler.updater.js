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

// const
var node_https = require('https'), node_fs = require('fs');

download_update_tool(update_script_url, update_CeJS);

function show_info(message) {
	process.title = message;
	console.info('\x1b[35;46m' + message + '\x1b[0m');
}

function download_update_tool(update_script_url, callback) {
	show_info('下載 ' + repository + ' 更新工具...');
	node_https.get(update_script_url, function(response) {
		var buffer_array = [], sum_size = 0;

		response.on('data', function(data) {
			sum_size += data.length;
			buffer_array.push(data);
		});

		response.on('end', function(e) {
			var contents = Buffer.concat(buffer_array, sum_size).toString(),
			//
			update_script_name = update_script_url.match(/[^\\\/]+$/)[0];
			console.info(update_script_name + ': ' + sum_size + ' bytes.');
			node_fs.writeFileSync(update_script_name, contents);

			if (typeof callback === 'function')
				callback(update_script_name);
		});
	})
	//
	.on('error', function(e) {
		// network error?
		// console.error(e);
		throw e;
	});
}

var latest_version_file, executing_at_tool_directory;
function update_CeJS(update_script_name) {
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

		show_info('下載並更新 Colorless echo JavaScript kit 組件...');
		updater.update(null, null, update_dependencies);
	});
}

function update_dependencies() {
	var package_data = JSON.parse(node_fs.readFileSync('package.json'));

	// 配置圖形使用者介面。
	updater.update_package('electron', true, '下載並更新圖形介面需要用到的組件 electron...', {
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

	show_info('CeJS 網路小說漫畫下載工具 更新完畢.');
}
