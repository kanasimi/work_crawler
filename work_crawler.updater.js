/**
 * CeJS 線上小說漫畫下載工具 命令行介面自動更新工具。
 * 
 * @since 2018/8/27
 */

'use strict';

var update_script_url = 'https://raw.githubusercontent.com/kanasimi/gh-updater/master/GitHub.updater.node.js';

// ----------------------------------------------------------------------------

// const
var node_https = require('https'), node_fs = require('fs');

download_update_tool(update_script_url, update_components);

function show_info(message) {
	process.title = message;
	console.info('\x1b[35;46m' + message + '\x1b[0m');
}

function download_update_tool(update_script_url, callback) {
	show_info('下載 GitHub 更新工具...');
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

function install_npm(package_name, message) {
	try {
		require(package_name);
	} catch (e) {
		// e.code: 'MODULE_NOT_FOUND'
		// console.error(e);

		show_info(message || ('安裝需要用到的組件 [' + package_name + ']...'));
		if (!node_fs.existsSync('node_modules'))
			node_fs.mkdirSync('node_modules');
		require('child_process').execSync(
		// https://github.com/kanasimi/work_crawler/issues/104
		// npm install electron --save-dev
		// sudo npm install -g electron --unsafe-perm=true --allow-root
		'npm i -D ' + package_name + '@latest', {
			stdio : 'inherit'
		});
	}
}

function update_components(update_script_name) {
	var executing_at_tool_directory = node_fs
			.existsSync('work_crawler_loder.js'), updater = require('./'
			+ update_script_name);

	show_info('下載並更新 CeJS 線上小說漫畫下載工具...');
	updater.update('kanasimi/work_crawler', executing_at_tool_directory
	// 解開到當前目錄下。
	? '.' : '', function() {
		if (executing_at_tool_directory) {
			// console.log('似乎在 CeJS 線上小說漫畫下載工具的工作目錄下，直接執行升級工具。');
			// console.log(process.cwd());
		} else {
			process.chdir('work_crawler-master');
		}

		show_info('下載並更新 Colorless echo JavaScript kit 組件...');
		updater.update(null, null, function() {
			// @see "dependencies" @ package.json
			// 下載並更新本工具需要用到的組件 gh-updater...
			install_npm('gh-updater');
			// 配置圖形使用者介面。
			install_npm('electron', '下載並更新圖形介面需要用到的組件 electron...');
			// install_npm('electron-builder');
			install_npm('electron-updater');

			show_info('CeJS 線上小說漫畫下載工具 更新完畢.');
		});
	});
}
