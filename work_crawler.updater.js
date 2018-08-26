/**
 * CeJS 線上小說漫畫下載工具 命令行介面自動更新工具。
 */

'use strict';

var update_script_url = 'https://raw.githubusercontent.com/kanasimi/CeJS/master/_for%20include/_CeL.updater.node.js';

// ----------------------------------------------------------------------------

// const
var node_https = require('https'), node_fs = require('fs'), child_process = require('child_process');

console.log('下載更新工具...');
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
		child_process.execSync('node ' + update_script_name
		//
		+ ' ' + 'kanasimi/work_crawler', {
			stdio : 'inherit'
		});
		process.chdir('work_crawler-master');
		child_process.execSync('node ' + '../' + update_script_name, {
			stdio : 'inherit'
		});
		node_fs.mkdir('node_modules');
		child_process.execSync('npm i -D electron@latest', {
			stdio : 'inherit'
		});
		console.log('CeJS 線上小說漫畫下載工具 更新完畢');
	});
})
//
.on('error', function(e) {
	// network error?
	// console.error(e);
	throw e;
});
