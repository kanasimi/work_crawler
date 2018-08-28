/**
 * CeJS 線上小說漫畫下載工具 命令行介面自動更新工具。
 * 
 * @since 2018/8/27
 */

'use strict';

var update_script_url = 'https://raw.githubusercontent.com/kanasimi/CeJS/master/_for%20include/_CeL.updater.node.js';

// ----------------------------------------------------------------------------

// const
var node_https = require('https'), node_fs = require('fs'), child_process = require('child_process');

download_update_tool(update_script_url);

function download_update_tool(update_script_url) {
	console.log('下載 GitHub 更新工具...');
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
			node_fs.writeFileSync(update_script_name, contents);

			update_components(update_script_name);
		});
	})
	//
	.on('error', function(e) {
		// network error?
		// console.error(e);
		throw e;
	});
}

function update_components(update_script_name) {
	console.log('下載/更新 Colorless echo JavaScript kit 組件...');
	child_process.execSync('node ' + update_script_name
	//
	+ ' ' + 'kanasimi/work_crawler', {
		stdio : 'inherit'
	});

	console.log('下載/更新 CeJS 線上小說漫畫下載工具...');
	process.chdir('work_crawler-master');
	child_process.execSync('node ' + '../' + update_script_name, {
		stdio : 'inherit'
	});

	console.log('下載/更新圖形使用者介面需要用到的組件...');
	if (!node_fs.existsSync('node_modules'))
		node_fs.mkdirSync('node_modules');
	child_process.execSync('npm i -D electron@latest', {
		stdio : 'inherit'
	});

	console.log('CeJS 線上小說漫畫下載工具 更新完畢.');
}
