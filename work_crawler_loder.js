/**
 * 載入批量下載線上作品（小說、漫畫）的主要功能。 Download novels / comics.
 */

'use strict';

// ----------------------------------------------------------------------------

// npm: 若有 CeJS module 則用之。
global.use_cejs_mudule = true;

// default directory to place comic images and novels. 指定下載的檔案要放置的標的目錄。
// '': the same directory as the .js running
global.data_directory = '';

// ------------------------------------
// configuration for arrangement/*.js

// default directory to place completed files
// 將會被指定為第一個存在的目錄。
global.completed_directory = [ '', '' ];

// 檔案分類完後要放置的標的目錄。
global.catalog_directory = '';

// 各個網站獨特的設定/特別的個人化設定。
global.site_configuration = {
	comico : {
		// 警告:帳號資訊是用明碼存放在檔案中。
		loginid : '',
		password : '',
		// 讓本工具自動使用閱讀卷。警告:閱讀券使用完就沒了。不可回復。
		auto_use_ticket : false
	}
};

// ------------------------------------

try {
	// Load configuration.
	require('./work_crawler_loder.configuration.js');
} catch (e) {
}

if (data_directory
// && !CeL.directory_exists(data_directory)
) {
	try {
		// 若是目標目錄無法存取，那就放在當前目錄下。
		require('fs').accessSync(data_directory);
	} catch (e) {
		console.warn('Warning: Can not access [' + data_directory
				+ ']!\n下載的檔案將放在工具檔所在的目錄下。');
		data_directory = '';
	}
}

// ----------------------------------------------------------------------------
// Load CeJS library.

try {
	require('./_CeL.loader.nodejs.js');
} catch (e) {
}

// @see _CeL.loader.nodejs.js

if (typeof CeL !== 'function' && use_cejs_mudule) {
	try {
		require('cejs');
	} catch (e) {
	}
}

if (typeof CeL !== 'function') {
	console.error('Failed to load CeJS library!\n');
	console.info('請先安裝 CeJS library:\nnpm install cejs\n\n'
	//
	+ 'Or you may trying the latest version:\n'
	//
	+ 'See https://github.com/kanasimi/CeJS');
	throw 'No CeJS library';
}

// ----------------------------------------------------------------------------
// Load modules.

// CeL.set_debug(6);

CeL.run([
// Add color to console messages. 添加主控端報告的顏色。
'interact.console',
// 載入批量下載小說、漫畫的主要功能。
'application.net.work_crawler' ]);

// ----------------------------------------------------------------------------

// console.log(process.argv);

var is_CLI = CeL.platform.browser === 'node';

global.work_id = is_CLI
		&& (CeL.env.arg_hash && (CeL.env.arg_hash.title || CeL.env.arg_hash.id) || process.argv[2])
		|| global.work_id;

if (is_CLI && !work_id && process.mainModule
// 檔案整理工具不需要下載作品，因此也不需要作品名稱。
&& (typeof need_work_id === 'undefined' || need_work_id)) {
	var main_script = process.mainModule.filename.match(/[^\\\/]+$/)[0],
	//
	options_arguments = ' [option=true] [option=value]';
	// 顯示幫助信息/用法說明。
	CeL.log('Usage:\n	node ' + main_script + ' "work title / work id"'
			+ options_arguments + '\n'
			//
			+ '	node ' + main_script + ' "l=work list file"'
			+ options_arguments);
	CeL.log('options:'
	//
	+ Object.entries(CeL.work_crawler.prototype.import_arg_hash)
	//
	.map(function(pair) {
		return '\n	' + pair[0] + '	(' + pair[1] + ')';
	}).join(''));
	process.exit();
}

function setup_crawler(crawler, crawler_module) {
	// 不重複設定。
	if (crawler.already_settled)
		return;
	crawler.already_settled = true;

	if (crawler_module) {
		crawler_module.exports = crawler;
		crawler.id = crawler_module.filename.match(/([^\\\/]+)\.js$/)[1];
	}

	// 儲存路徑。圖片檔+紀錄檔下載位置。
	// main_directory 必須以 path separator 作結。
	crawler.main_directory = data_directory + crawler.id
			+ CeL.env.path_separator;

	if (site_configuration[crawler.id]) {
		Object.assign(crawler, site_configuration[crawler.id]);
	}

	CeL.debug(crawler.id + ', ' + crawler.main_directory, 1, 'setup_crawler');
}

global.setup_crawler = setup_crawler;

function start_crawler(crawler, crawler_module) {
	setup_crawler(crawler, crawler_module);
	// console.log(crawler_module);
	if (is_CLI) {
		crawler.start(work_id);
	}
}

global.start_crawler = start_crawler;

// CeL.set_debug(3);

