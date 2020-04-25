/**
 * 載入批量下載網路作品（小說、漫畫）的主要功能。 Download novels / comics.
 * 
 * TODO: https://github.com/iridakos/bash-completion-tutorial
 */

'use strict';

// ----------------------------------------------------------------------------

var node_fs = require('fs');

var default_configuration_file = './work_crawler.default_configuration.js';
var user_configuration_file = './work_crawler.configuration.js';

try {
	// Load default configuration.
	require(default_configuration_file);
} catch (e) {
}

try {
	// Load configuration.
	require(user_configuration_file);
} catch (e) {
	if (false) {
		// File not exists?
		console.error('無法載入 ' + user_configuration_file + ' 裡的設定。或許是因為程式碼有錯誤？');
	}
	if (false) {
		// 將 default_configuration_file 改名成 user_configuration_file。
		try {
			// node_fs.renameSync(default_configuration_file,
			// user_configuration_file);
		} catch (e) {
			// e.g., released package version?
		}
	}
}

// ----------------------------------------------------------------------------
// Load CeJS library.

try {
	require('./_CeL.loader.nodejs.js');
} catch (e) {
	// console.error(e);
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

var is_CLI = CeL.platform.is_CLI;

if (is_CLI) {
	// for i18n: define gettext() user domain resource location.
	// gettext() will auto load (CeL.env.domain_location + language + '.js').
	// e.g., resource/cmn-Hant-TW.js, resource/ja-JP.js
	CeL.env.domain_location = module.filename.replace(/[^\\\/]*$/, 'resource'
			+ CeL.env.path_separator);
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

// e.g., # node task.js debug=2
if (CeL.env.arg_hash && (CeL.env.arg_hash.set_debug || CeL.env.arg_hash.debug)) {
	CeL.set_debug(CeL.env.arg_hash.set_debug || CeL.env.arg_hash.debug);
}

if (is_CLI) {
	// CeL.gettext.use_domain('GUESS', true);
}

global.work_id = is_CLI
		&& (CeL.env.arg_hash && (CeL.env.arg_hash.title || CeL.env.arg_hash.id) || process.argv[2])
		|| global.work_id;

if (data_directory
// && !CeL.directory_exists(data_directory)
) {
	try {
		// 若是目標目錄無法存取，那就放在當前目錄下。
		node_fs.accessSync(data_directory);
		// 最後必須加上目錄分隔號 `\\’。
		if (/^[\\\/]$/.test(data_directory))
			data_directory += CeL.env.path_separator;
	} catch (e) {
		// 只 call 一次 CeL.warn()，這樣在 GUI 會顯示在同一行。
		CeL.warn([ {
			T : [ '警告：無法存取作品存放目錄 [%1]！', data_directory ]
		}, '\n', {
			T : '下載的檔案將放在預設目錄下。'
		} ]);
		data_directory = '';
	}
}

// used in: function initializer() @ gui_electron_functions.js
function option_type_token(arg_type_data, colors) {
	if (!arg_type_data)
		return '';

	var option_types = [ '	(' ];

	Object.keys(arg_type_data).forEach(function(type) {
		var condition = arg_type_data[type];
		if (Array.isArray(condition)) {
			condition = condition.join('; ');
		} else {
			condition = JSON.stringify(condition);
		}
		option_types.push({
			T : type,
			S : {
				color : colors && colors[0] || 'green'
			}
		});
		if (condition) {
			// TODO: onclick
			option_types.push(': ', {
				T : condition,
				S : {
					color : colors && colors[1] || 'yellow'
				}
			});
		}
		option_types.push(' | ');
	});

	if (option_types.length === 1) {
		// assert: There is no types indecated within `arg_type_data`.
		option_types = '';
	} else {
		// remove last separator
		option_types.splice(-1, 1, ')');
	}

	return option_types;
}

if (is_CLI && !work_id && require.main
// 檔案整理工具不需要下載作品，因此也不需要作品名稱。
&& (typeof need_work_id === 'undefined' || need_work_id)) {
	CeL.info({
		T : 'CeJS 網路小說漫畫下載工具'
	});
	CeL.log({
		T : [
				'欲採用圖形介面請執行 `%1`。',
				'start_gui_electron.'
						+ (CeL.platform.is_Windows() ? 'bat' : 'sh') ]
	});

	CeL.log('');
	// --------------------------------

	var main_script = require.main
			&& require.main.filename.match(/[^\\\/]+$/)[0],
	//
	options_arguments = ' [' + CeL.gettext('option=true') + '] ["'
			+ CeL.gettext('option=value') + '"]';

	// 顯示幫助信息/用法說明。
	CeL.log({
		T : 'Usage:'
	});
	// 分兩行顯示可以避免大螢幕上紫色背景不斷行問題。
	CeL.log({
		T : '	node ' + main_script + ' "' + CeL.gettext('作品標題或 id') + '"'
				+ options_arguments,
		S : {
			color : 'white',
			backgroundColor : 'magenta'
		}
	});
	CeL.log({
		T : '	node ' + main_script + ' "l=' + CeL.gettext('作品列表檔案') + '"'
				+ options_arguments,
		S : {
			color : 'white',
			backgroundColor : 'magenta'
		}
	});

	CeL.log('');
	// --------------------------------

	CeL.log({
		T : 'Options:'
	});
	Object.entries(CeL.work_crawler.prototype.import_arg_hash)
	//
	.forEach(function(pair) {
		CeL.log([ '  ', {
			T : pair[0],
			S : {
				color : 'magenta',
				backgroundColor : 'cyan'
			}
		}, option_type_token(pair[1]) ]);
		CeL.log([ '    ', {
			T : CeL.gettext('download_options.' + pair[0]),
			S : {
				color : 'white'
			}
		} ]);
	});

	// --------------------------------

	process.exit();
}

global.option_type_token = option_type_token;

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

	// 下載檔案儲存目錄路徑。圖片檔與紀錄檔的下載位置。下載網路的作品檔案後，將儲存於此目錄下。
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
	if (!is_CLI) {
		// GUI has its process.
		return;
	}

	if (work_id === 'l' && default_favorite_list) {
		work_id = default_favorite_list;
		if (typeof work_id === 'function')
			work_id = work_id.call(crawler);
	}

	// 從其他程式匯入作品資料 可使用API會更有效率
	// show work information only 純粹只要在命令列介面顯示作品資料即可
	if (CeL.env.arg_hash.show_information_only) {
		crawler.data_of(work_id, function got_work_data(work_data) {
			// console.log(work_data);
			crawler.show_work_data(work_data);
		}, {
			get_data_only : CeL.env.arg_hash.show_information_only
		});
		return;
	}

	crawler.start(work_id, crawler.after_download_list);
}

global.start_crawler = start_crawler;

// CeL.set_debug(3);

