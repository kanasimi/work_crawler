/**
 * 載入批量下載漫畫的主要功能。 Download comics.
 */

'use strict';

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

CeL.run([
// Add color to console messages. 添加主控端報告的顏色。
'interact.console',
// 載入批量下載漫畫的主要功能。
'application.net.comic' ]);

// ----------------------------------------------------------------------------

// console.log(process.argv);

global.work_id = CeL.env.arg_hash
		&& (CeL.env.arg_hash.title || CeL.env.arg_hash.id) || process.argv[2];

if (!work_id && process.mainModule) {
	var main_script = process.mainModule.filename.match(/[^\\\/]+$/)[0];
	CeL.log('Usage:\nnode ' + main_script + ' "work title / work id"\nnode '
			+ main_script + ' "l=work list file"');
	process.exit();
}

// CeL.set_debug(3);
