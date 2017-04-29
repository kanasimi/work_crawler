/**
 * 載入批量下載線上作品（小說、漫畫）的主要功能。 Download novels / comics.
 */

'use strict';


// ----------------------------------------------------------------------------
// 若有 CeJS library 則用之。
global.use_cejs_mudule = true;
// require('./_CeL.loader.nodejs.js');

try {
	// Load CeJS library.
	require('cejs');

} catch (e) {
	// ----------------------------------------------------------------------------
	// Load CeJS library. For node.js loading.
	// Copy/modified from "/_for include/node.loader.js".
	'path/to/cejs'
	// 載入泛用（非特殊目的使用）之功能。
	.split('|').some(function(path) {
		if (path.charAt(0) === '#') {
			// path is a comment
			return;
		}
		try {
			// accessSync() throws if any accessibility checks fail, and does
			// nothing otherwise.
			require('fs').accessSync(path);
			var loader = '/_for include/node.loader.js';
			require(path + (path.indexOf('/') !== -1 ? loader
			//
			: loader.replace(/\//g, '\\')));
			return true;
		} catch (e) {
		}
	});

	if (typeof CeL !== 'function') {
		// No CeJS library.
		throw '請先安裝 CeJS library:\nnpm install cejs';
	}
}

// ----------------------------------------------------------------------------
// Load module.

// CeL.set_debug(6);

CeL.run([
// Add color to console messages. 添加主控端報告的顏色。
'interact.console',
// 載入批量下載小說、漫畫的主要功能。
'application.net.work_crawler' ]);

// ----------------------------------------------------------------------------

// console.log(process.argv);

global.work_id = CeL.env.arg_hash
		&& (CeL.env.arg_hash.title || CeL.env.arg_hash.id) || process.argv[2]
		|| global.work_id;

if (!work_id && process.mainModule
		&& (typeof need_work_id === 'undefined' || need_work_id)) {
	var main_script = process.mainModule.filename.match(/[^\\\/]+$/)[0];
	CeL.log('Usage:\nnode ' + main_script + ' "work title / work id"\nnode '
			+ main_script + ' "l=work list file"');
	process.exit();
}

// default directory '': the same as the .js running
global.data_directory = '';

// main_directory 必須以 path separator 作結。
CeL.work_crawler.prototype.main_directory = data_directory
		+ CeL.work_crawler.prototype.main_directory;

// CeL.set_debug(3);
