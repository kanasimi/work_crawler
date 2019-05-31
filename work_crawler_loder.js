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

// 自動更新功能。
global.auto_update = true;

// ------------------------------------
// configuration for arrangement/*.js

// ** 請別直接改變這邊的設定。在每次更新時，本檔案可能會被覆寫為預設設定。

// default directory to place completed files
// 將會被指定為第一個存在的目錄。
global.completed_directory = [ '', '' ];

// 檔案分類完後要放置的標的目錄。
global.catalog_directory = '';

// 各個網站獨特的設定/特別的個人化設定。
global.site_configuration = {};

// comico 搭配閱讀卷示範
site_configuration.comico = site_configuration.comico_jp = site_configuration.comico_jp_plus = {
	// 讓本工具自動使用閱讀卷。警告:閱讀券使用完就沒了。不可回復。
	// auto_use_ticket : true,
	// 警告:帳號資訊是用明碼存放在檔案中。
	loginid : '',
	password : ''
};

// 代理伺服器 "hostname:port"
global.proxy_server = '';

/** {String|Function}儲存最愛作品清單的目錄。可以把最愛作品清單放在獨立的檔案，便於編輯。 */
global.favorite_list_directory = '';
// 儲存最愛作品清單的目錄 @ .main_directory。
favorite_list_directory = function() {
	return this.main_directory + 'favorite.txt';
};

/** {String|Function}當只輸入 "l" 時的轉換。 */
global.default_favorite_list = '';

// ------------------------------------

try {
	// Load configuration.
	require('./work_crawler_loder.configuration.js');
} catch (e) {
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
		// no cejs
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
// Setup CeJS before loading modules.

// 判別是否運行了多個 CeL 實體使用。
if (!CeL.random_id)
	CeL.random_id = Math.random();

// GUI: CeL.platform.browser === 'electron'
var is_CLI = CeL.platform.browser === 'node';

if (is_CLI) {
	// for i18n: define gettext() user domain resource location.
	// gettext() will auto load (CeL.env.domain_location + language + '.js').
	// e.g., resource/cmn-Hant-TW.js, resource/ja-JP.js
	CeL.env.domain_location = module.filename.replace(/[^\\\/]*$/, 'resource'
			+ CeL.env.path_separator);

	// CeL.gettext.use_domain('GUESS', true);
}

// ----------------------------------------------------------------------------
// Load modules.

// CeL.set_debug(6);

// 先載入 application.platform.nodejs 是為了
// CeL.env.domain_location @ gui_electron_functions.js
CeL.run('application.platform.nodejs', [
// Add color to console messages. 添加主控端報告的顏色。
'interact.console',
// 載入批量下載小說、漫畫的主要功能。
'application.net.work_crawler',
// for internationalization and localization 國際化與在地化 gettext()
'application.locale' ], function() {
	// 不自動匯入 .env.arg_hash
	CeL.work_crawler.prototype.auto_import_args = false;
});

// ----------------------------------------------------------------------------

// console.log(process.argv);

global.work_id = is_CLI
		&& (CeL.env.arg_hash && (CeL.env.arg_hash.title || CeL.env.arg_hash.id) || process.argv[2])
		|| global.work_id;

if (data_directory
// && !CeL.directory_exists(data_directory)
) {
	try {
		// 若是目標目錄無法存取，那就放在當前目錄下。
		require('fs').accessSync(data_directory);
	} catch (e) {
		// 只 call 一次 CeL.warn()，這樣在 GUI 會顯示在同一行。
		CeL.warn([ {
			T : [ '警告：無法存取作品存放目錄 [%1]！', data_directory ]
		}, '\n', {
			T : '下載的檔案將放在工具檔所在的目錄下。'
		} ]);
		data_directory = '';
	}
}

if (is_CLI && !work_id && process.mainModule
// 檔案整理工具不需要下載作品，因此也不需要作品名稱。
&& (typeof need_work_id === 'undefined' || need_work_id)) {
	var main_script = process.mainModule
			&& process.mainModule.filename.match(/[^\\\/]+$/)[0],
	//
	options_arguments = ' [' + CeL.gettext('option=true') + '] ["'
			+ CeL.gettext('option=value') + '"]';

	CeL.log({
		T : 'Usage:'
	});
	CeL.log({
		T : '	node ' + main_script + ' "' + CeL.gettext('作品標題或 id') + '"'
		// 顯示幫助信息/用法說明。
		+ options_arguments + '\n' + '	node ' + main_script + ' "l='
				+ CeL.gettext('作品列表檔案') + '"' + options_arguments,
		S : {
			color : 'white',
			backgroundColor : 'magenta'
		}
	});

	CeL.log({
		T : 'Options:'
	});
	Object.entries(CeL.work_crawler.prototype.import_arg_hash)
	//
	.forEach(function(pair) {
		var arg_type_data = pair[1], types = [];

		Object.keys(arg_type_data).forEach(function(type) {
			var condition = arg_type_data[type];
			if (Array.isArray(condition)) {
				condition = condition.join('; ');
			} else {
				condition = JSON.stringify(condition);
			}
			types.push({
				T : type,
				S : {
					color : 'green'
				}
			});
			if (condition) {
				types.push(': ', {
					T : condition,
					S : {
						color : 'yellow'
					}
				});
			}
			types.push(' | ');
		});
		// remove last separator
		types.pop();

		CeL.log([ '  ', {
			T : pair[0],
			S : {
				color : 'magenta',
				backgroundColor : 'cyan'
			}
		}, '	(',
		// @see function initializer() @ gui_electron_functions.js
		types, ')' ]);
		CeL.log([ '    ', {
			T : CeL.gettext('download_options.' + pair[0]),
			S : {
				color : 'white'
			}
		} ]);
	});

	process.exit();
}

// ----------------------------------------------------------------------------

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
	crawler.setup_value('main_directory', data_directory + crawler.id);

	crawler.setup_value(site_configuration[crawler.id]);

	if (proxy_server) {
		crawler.setup_value('proxy', proxy_server);
	}

	// 從命令列引數來的設定，優先等級比起作品預設設定更高。
	// console.log(CeL.env.arg_hash);
	crawler.import_args();

	if (typeof setup_crawler.prepare === 'function') {
		setup_crawler.prepare(crawler, crawler_module);
	}

	CeL.debug(crawler.id + ', ' + crawler.main_directory, 1, 'setup_crawler');
}

global.setup_crawler = setup_crawler;

function start_crawler(crawler, crawler_module) {
	setup_crawler(crawler, crawler_module);
	// console.log(crawler_module);
	if (is_CLI) {
		if (work_id === 'l' && default_favorite_list) {
			work_id = default_favorite_list;
			if (typeof work_id === 'function')
				work_id = work_id.call(crawler);
		}

		crawler.start(work_id, crawler.after_download_list);
	}
}

global.start_crawler = start_crawler;

// CeL.set_debug(3);

