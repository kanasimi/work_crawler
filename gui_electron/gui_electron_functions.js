/**
 * @fileoverview 圖形介面主要執行機制。
 * 
 * 新增或更新網站的時候，除了.js 工具檔功能寫完之外，還必須要更改 README.md、本檔案中的 download_sites_set 以及
 * GitHub 上的簡介。
 * 
 * 增加下載選項的時候，必須同步更改本檔案中的 download_options_set、CeL.application.net.work_crawler
 * 中的 Work_crawler_prototype, import_arg_hash。
 */

// const
var node_electron = require('electron'),
// const: work_crawler/
base_directory = '../',
// const. 主要以搜尋時使用的語言來區分，而非作品出產國。
site_type_description = {
	'comic.cmn-Hant-TW'
	// gettext_config:{"id":"traditional-chinese-webcomics"}
	: '繁體字漫畫',
	'comic.cmn-Hans-CN'
	// gettext_config:{"id":"simplified-chinese-webcomics"}
	: '中国内地漫画',
	'comic.ja-JP'
	// gettext_config:{"id":"japanese-webcomics"}
	: '日本語のウェブコミック',
	'comic.en-US'
	// gettext_config:{"id":"english-webcomics"}
	: 'English webcomics',
	'novel.cmn-Hans-CN'
	// gettext_config:{"id":"simplified-chinese-web-fictions"}
	: '中国内地小说',
	'novel.ja-JP'
	// gettext_config:{"id":"japanese-web-fictions"}
	: '日本語のオンライン小説'
},
// const 縱使語言不同，也應該採用不同的 site id。否則檔案會存放到同一個目錄底下，可能造成檔案錯亂。
download_sites_set = {
	'comic.cmn-Hant-TW' : {
		'999comics' : '99漫畫網',

		manhuagui_tw : '繁體版漫畫櫃',

		comicbus : '無限動漫',

		cartoonmad : '動漫狂',

		dogemanga : '漫畫狗',

		dmeden : '動漫伊甸園',

		'18comic' : '禁漫天堂',

		comico : 'comico',

		webtoon : 'WEBTOON',

		toomics_tc : 'Toomics 玩漫'
	},
	'comic.cmn-Hans-CN' : {
		qq : '腾讯漫画',
		// '163' : '网易漫画',
		u17 : '有妖气',
		zymk : '知音漫客',
		dajiaochong : '大角虫漫画',
		kuaikan : '快看漫画',
		weibo : '微博动漫',
		bilibili : '哔哩哔哩漫画',
		buka : '布卡漫画',
		sfacg : 'SF漫画',

		katui : '卡推漫画',
		pufei : '扑飞漫画',
		taduo : '塔多漫画',
		'733dm' : '733动漫网',
		'733mh' : '733漫画网',
		mh160 : '漫画160',
		// nokiacn : '乙女漫画',
		yinvmh : '乙女漫画',
		iqg365 : '365漫画网',
		emw : '一漫网',
		aikanmh : '爱看漫画',
		wuyouhui : '友绘漫画网',
		'88bag' : '188漫画网',
		// '76' : '76漫画',
		'517' : '我要去漫画',
		dagu : '大古漫画网',
		manhuadb : '漫画DB',
		manhuacat : '漫画猫',

		// '2manhua' : '爱漫画',
		'57mh' : '57漫画网',

		dmzj : '动漫之家',
		dm5 : '动漫屋',
		'1kkk' : '漫画人',
		// tohomh : '土豪漫画',
		// ikmhw : '爱看漫画网',
		r2hm : '无双漫画',
		hanmanwo : '韩漫窝',
		youma : '有码漫画',
		mymhh : '梦游漫画',

		// manhuatai : '漫画台',

		manhuagui : '看漫画/漫画柜',
		gufengmh : '古风漫画网',
		duoduomh : '多多漫画',
		'36mh' : '36漫画网',
		manhuaniu : '漫画牛',
		// mhkan: deprecated
		// mhkan : '漫画看',
		mh1234 : '漫画1234',
		'930mh' : '亲亲漫画网',
		// '50mh' : '50漫画网',

		// omanhua : '哦漫画',

		hhcool : '汗汗酷漫',

		qiman5 : '奇漫屋',

		// fed 系統
		// 2021/8/2 採用 Cloudflare 的阻斷服務攻擊保護
		// ohmanhua : 'Oh漫画',

		migudm : '咪咕圈圈',

		dongman : '咚漫',

		toomics_sc : 'Toomics 玩漫'
	},
	'comic.ja-JP' : {
		nico_seiga : 'ニコニコ静画',
		ComicWalker : 'ComicWalker',

		youngaceup : 'ヤングエースUP',
		// TYPE-MOONコミックエース
		tmca : 'TYPE-MOONエース',

		AlphaPolis_official_manga : 'アルファポリス 公式',
		AlphaPolis_user_manga : 'アルファポリス 投稿',

		moae : 'モアイ',

		pixivcomic : 'pixivコミック',
		// OVERLAP : 'OVERLAP',
		// MAGCOMI : 'MAGCOMI',
		cycomi : 'サイコミ',

		// XOY : 'WEBTOON ja',

		comico_jp : 'コミコ',
		comico_jp_plus : 'オトナ限定 コミコ'
	},
	'comic.en-US' : {
		webtoon_en : 'WEBTOON en',

		toomics_en : 'Toomics',

	// 不再維護
	// mangamew : 'Manga Mew',
	// manganew : 'Manga New',

	// Rocaca : [ 'rocaca (', {
	// gettext_config:{"id":"no-longer-maintained"}
	// T : '不再維護'
	// }, ')' ]

	// mrblue : 'Mr.Blue'
	},
	'novel.cmn-Hans-CN' : {
		// ck101 : '卡提諾論壇 小說頻道',

		qidian : '起点中文网',

		// PTCMS
		'23us' : '顶点小说',
		booktxt : '顶点小说 booktxt',
		zwdu : '八一中文网',
		x81zw : '新八一中文网',
		'88dus' : '八八读书网',
		'630book' : '恋上你看书网',

		// biquge : '笔趣阁',
		biqugse : '笔趣阁',
		xbiquke : '笔趣阁',
		'xbiquge.cc' : '笔趣阁.cc',
		// xbiquge : '新笔趣阁',

		// 杰奇小说连载系统
		kanshushenzhan : '看书神站',
		huaxiangju : '花香居',
		zhuishubang : '追书帮',

		xshuyaya : '丫丫电子书',

		daocaoren : '稻草人书屋',
		'51shucheng' : '无忧书城',
		luoxia : '落霞小说网',
		kanunu : '努努书坊',
		piaotian : '飘天文学'
	},
	'novel.ja-JP' : {
		AlphaPolis : 'アルファポリス',

		Hameln : 'ハーメルン',

		kakuyomu : 'カクヨム',

		yomou : '小説を読もう！',
		noc : 'ノクターンノベルズ',
		mid : 'ミッドナイトノベルズ',
		mnlt : 'ムーンライトノベルズ'
	}
},
// 所有網站都使用相同值的下載選項。
// will save at default_configuration_file_name
// 請注意：這些設定將會被存在 default_configuration_file_name。因此若將這個檔案刪除，則設定將會被重設！
global_options = {
	preserve_download_work_layer : 'boolean',
	play_finished_sound : 'boolean',
	archive_program_path : 'string:fso_file',
	CSS_theme : 'string',
	// fso:directory
	data_directory : 'string:fso_directory'
},
/** 改變下載選項後額外需要做的處理 */
options_post_processor = Object.create(null),
// const 下載選項。有順序。常用的排前面。
// @see CeL.application.net.work_crawler
download_options_set = Object.create(null),
// const `global.original_data_directory`/`default_configuration_file_name`
// 本設定檔案會放在 `global.original_data_directory` 這個目錄下。假如另外更動了
// `global.data_directory`，那麼所有的作品資料以及圖片都會放在 `global.data_directory`
// 下面，此時本檔案和作品資料就會放在不同的目錄下。
default_configuration_file_name = 'work_crawler.configuration.json',
//
theme_hash = {
	// 🔆
	light : '☀️',
	// 🌙
	dark : '🌃'
}, theme_list = Object.keys(theme_hash);

var DEFAULT_THEME_TEXT = 'default', default_theme_name;
theme_list.push(DEFAULT_THEME_TEXT);

'data_directory,recheck,start_chapter_NO,start_chapter_title,chapter_filter,regenerate,reget_chapter,search_again,cache_title_to_id,acceptable_types,archive_images,images_archive_extension,MAX_ERROR_RETRY,allow_EOI_error,MIN_LENGTH,timeout,skip_error,skip_chapter_data_error,one_by_one,chapter_time_interval,main_directory,vertical_writing,convert_to_language,user_agent,proxy,cookie,write_chapter_metadata,write_image_metadata,preserve_download_work_layer,play_finished_sound,archive_program_path'
// @see work_crawler/resource/locale of work_crawler - locale.csv
.split(',').forEach(function(item) {
	download_options_set[item] = 'download_options.' + item;
});

var save_config_this_time = true;

var site_used, default_configuration, download_site_nodes = [], download_options_nodes = {},
// 為 electron-builder 📦安裝包/發行版
is_installation_package,
// 會儲存到 crawler.preference.crawler_configuration 的選項。
save_to_preference = Object.assign({}, download_options_set),
// Windows 10: Windows NT 10.0; Win64; x64
old_Unicode_support = navigator.appVersion.match(/Windows NT (\d+(?:\.\d))/);
if (old_Unicode_support) {
	// 舊版本的 Windows 7 不支援"⬚ "之類符號。
	old_Unicode_support = +old_Unicode_support[1] < 10;
}

// save_to_preference 不可包含 main_directory，因為已來不及，且會二次改變 main_directory。
delete save_to_preference.main_directory;

require(base_directory + 'work_crawler_loader.js');

// declaration for gettext(). @see setup_language_menu()
var _;
// 設定國際性語言 language force convert. @see setup_language_menu()
var force_convert = [ 'en' ];

// @see setup_language_menu()
// for i18n: define gettext() user domain resources location.
// gettext() will auto load (CeL.env.domain_location + language + '.js').
// e.g., resources/cmn-Hant-TW.js, resources/ja-JP.js
CeL.env.domain_location = function() {
	is_installation_package = CeL.is_installation_package();

	return CeL.env.domain_location
	// CeL.env.script_base_path: 形如 ...'/work_crawler/gui_electron/'
	= CeL.env.script_base_path.replace(/gui_electron[\\\/]$/, '')
	// resources/
	+ CeL.env.resources_directory_name + '/';
	// 在安裝包中， `process.cwd()` 可能為
	// C:\Users\user\AppData\Local\Programs\work_crawler
// 因此 CeL.env.domain_location 必須提供完整路徑。
};

CeL.run([ 'application.debug.log', 'interact.DOM' ], initializer);

// ---------------------------------------------------------------------//

function check_max_logs() {
	var panel = CeL.get_element('max_logs'), show = CeL.toggle_display(panel) !== 'none';
	CeL.Log.set_max_logs(show ? panel.value : undefined);
	CeL.set_class(this, 'disabled', {
		remove : show
	});
	// gettext_config:{"id":"limit-log-lines"}
	this.innerHTML = _(CeL.DOM_data(this).gettext = show ? '限制訊息行數'
	// gettext_config:{"id":"do-not-limit-log-lines"}
	: '不限制訊息行數');
	// .children[0] (<span>) === .firstElementChild
	// !== .firstChild (maybe #text)
	CeL.node_value(this.parentNode.children[0], show ? '✂️' : '');
}

// initialization
function initializer() {
	// 將更新程序放在一開始，確保一定會執行更新程序，避免後面出現錯誤時不作更新。
	// 延遲檢測更新，避免 hang 住。
	setTimeout(check_update, 80);

	// --------------------------------

	setup_language_menu();

	if (!global.data_directory) {
		global.data_directory = CeL.determin_download_directory();
	}
	/** const */
	global.original_data_directory = data_directory;

	setup_initial_messages();

	// --------------------------------

	// read default configuration
	default_configuration = CeL.get_JSON(original_data_directory
			+ default_configuration_file_name)
			|| Object.create(null);

	if (!default_configuration.archive_program_type) {
		// '7z'
		default_configuration.archive_program_type = CeL.archive.default_program_type;
	}
	if (default_configuration.archive_program_path && CeL.storage.file_exists(
	// .slice(1, -1): e.g., '"C:\\Program Files\\7-Zip\\7z.exe"'
	// → 'C:\\Program Files\\7-Zip\\7z.exe'
	default_configuration.archive_program_path.slice(1, -1))) {
		// export to CeL.archive
		CeL.archive.executable_file_path[default_configuration.archive_program_type] = default_configuration.archive_program_path;
	} else {
		default_configuration.archive_program_path = CeL.archive.executable_file_path[default_configuration.archive_program_type];
	}

	change_data_directory(default_configuration.data_directory
			|| data_directory);

	// --------------------------------

	setup_theme_selecter();

	// --------------------------------

	setup_download_sites();

	// --------------------------------

	var user_agent = navigator.userAgent.replace(
			/(?:work_crawler|Electron)[\/.\d ]*/ig, '');
	if (user_agent)
		CeL.work_crawler.prototype.user_agent = user_agent;

	Object.assign(CeL.work_crawler.prototype, {
		after_download_chapter : after_download_chapter,
		onwarning : onerror,
		onerror : onerror
	});

	// --------------------------------

	setup_download_options();

	// --------------------------------

	set_click_trigger('favorites_trigger', 'favorite_list');

	set_click_trigger('search_results_trigger', 'search_results');

	set_click_trigger('download_job_trigger', 'download_job_queue');

	// --------------------------------

	setup_ipcRenderer();

	// https://developer.mozilla.org/en-US/docs/Web/API/Notification/permission
	// https://electronjs.org/docs/tutorial/desktop-environment-integration
	// https://electronjs.org/docs/api/notification
	if (true || !window.Notification) {
	} else if (Notification.permission === 'granted') {
	} else if (Notification.permission !== 'denied') {
		// assert: Notification.permission === 'default' ||
		// Notification.permission === 'undefined'
		Notification.requestPermission(function(permission) {
			if (permission === 'granted') {
				var notification = new Notification('');
			}
		});
	}

	// gettext_config:{"id":"cejs-online-novels-comics-downloader"}
	process.title = _('CeJS 網路小說漫畫下載工具');

	// --------------------------------

	setup_DOM_events();

	// CeL.set_debug();
}

// ------------------------------------

function on_menu_changed() {
	// gettext_config:{"id":"untranslated-message-count"}
	if (+_('untranslated message count') > 0) {
		CeL.info({
			// gettext_config:{"id":"there-are-currently-$1-$2-messages-that-have-not-been-translated.-welcome-to-translate-with-us"}
			T : [ '現有%1條%2訊息尚未翻譯，歡迎您一同參與翻譯訊息！',
			// gettext_config:{"id":"untranslated-message-count"}
			_('untranslated message count'),
			// CeL.gettext.get_alias(CeL.gettext.default_domain)
			// gettext_config:{"id":"using-language"}
			_('using language') ]
		});
	}
}

function setup_language_menu() {
	_ = CeL.gettext;

	_.create_menu('language_menu', [ 'TW', 'CN', 'ja', 'en', 'pt', 'ko' ],
	// 預設介面語言繁體中文+...
	on_menu_changed);

	// translate all nodes to show in specified language (or default domain).
	_.translate_nodes();

	// --------------------------------

	_.load_domain(force_convert[0]);
}

function setup_initial_messages() {
	CeL.Log.set_board('log_panel');
	// CeL.set_debug();
	// 設置完成
	// CeL.debug('Log panel has been set.');
	CeL.Log.clear();

	// for 限制訊息行數
	CeL.adapt_input_validation();
	CeL.add_listener('change', function() {
		if (this.style.display !== 'none') {
			CeL.Log.set_max_logs(this.value);
		}
	}, 'max_logs');

	CeL.debug({
		// gettext_config:{"id":"working-directory-$1"}
		T : [ 'Working directory: %1', CeL.storage.working_directory() ]
	}, 1);
	CeL.debug({
		// gettext_config:{"id":"environment-variables-$1"}
		T : [ '所有環境變數：%1', JSON.stringify(process.env) ]
	}, 1);

	// --------------------------------

	CeL.info({
		// Default download location
		// gettext_config:{"id":"default-download-directory-$1"}
		T : [ 'Default download directory: %1', data_directory ]
	});

	// --------------------------------

	// gettext_config:{"id":"let-s-<a>translate-the-interface<-a>-together"}
	var translation_message = CeL.gettext('歡迎與我們一同<a>翻譯介面文字</a>！');
	var matched = translation_message
			.match(/^([\s\S]*?)<a>([\s\S]*?)<\/a>([\s\S]*?)$/);
	CeL.info(matched ? {
		// 🚧 https://weblate.org/zh-hant/
		span : [ matched[1], {
			a : matched[2],
			href : 'https://github.com/kanasimi/work_crawler/issues/185',
			onclick : open_URL
		}, matched[3] ]
	} : translation_message);
	on_menu_changed();

	// --------------------------------

	if (CeL.platform.is_Windows()) {
		CeL.new_node([ {
			a : {
				// gettext_config:{"id":"copy-and-paste-shortcuts"}
				T : '複製貼上快速鍵'
			},
			href : 'https://en.wikipedia.org/wiki/'
			//
			+ 'Cut,_copy,_and_paste#Common_keyboard_shortcuts',
			onclick : open_URL
		}, ' - ', {
			// gettext_config:{"id":"copy-selected-items"}
			T : '複製選取的項目：'
		}, {
			kbd : 'Ctrl+C'
		}, ' ', {
			span : ' | ',
			S : "color: blue;"
		}, {
			// gettext_config:{"id":"paste"}
			T : '貼上：'
		}, {
			kbd : 'Ctrl+V'
		} ], 'small_tips');
	}
}

function setup_ipcRenderer() {
	'debug,log,info,warn,error'.split(',').forEach(function(log_type) {
		node_electron.ipcRenderer
		//
		.on('send_message_' + log_type, function(event, message) {
			CeL[log_type]({
				T : message
			});
		});
	});
	node_electron.ipcRenderer.on('send_message_isPackaged', function(event,
			isPackaged) {
		is_installation_package = isPackaged;
	});

	node_electron.ipcRenderer.send('send_message', 'did-finish-load');
	node_electron.ipcRenderer.send('send_message', 'check-for-updates');

	node_electron.ipcRenderer.on('open_dialog', recerive_dialog_result);
}

// ------------------------------------

// Select CSS theme
function select_theme(theme, no_save) {
	if (typeof theme !== 'string') {
		theme = CeL.DOM_data(this);
		theme = theme && theme.theme_label;
	}
	if (!theme_list.includes(theme)) {
		CeL.warn([ 'select_theme: ', {
			// gettext_config:{"id":"invalid-theme-name-$1"}
			T : [ 'Invalid theme name: %1', theme ]
		} ]);
		return;
	}

	var theme_used = theme === DEFAULT_THEME_TEXT ? default_theme_name : theme;
	theme_list.forEach(function(theme_name) {
		CeL.set_class(document.body, theme_name, {
			remove : theme_name !== theme_used
		});
	});

	var node_list = document.querySelectorAll('#select_theme_panel .button');
	node_list.forEach(function(node) {
		CeL.set_class(node, 'selected', {
			remove : theme !== CeL.DOM_data(node).theme_label
		});
	});

	if (!no_save) {
		default_configuration.CSS_theme = theme;
		save_default_configuration();
	}
}

function setup_theme_selecter() {
	if (CeL.DOM.navigator_theme) {
		default_theme_name = CeL.DOM.navigator_theme;
	}

	var theme_nodes = [ {
		// gettext_config:{"id":"theme"}
		T : '布景主題：'
	} ];
	theme_list.forEach(function(theme_name) {
		var _theme_name = theme_name === DEFAULT_THEME_TEXT
		//
		? default_theme_name : theme_name;
		theme_nodes.push({
			span : [ theme_hash[_theme_name] || '', {
				T : theme_name + ' theme',
				force_convert : force_convert
			} ],
			C : [ _theme_name, 'button' ],
			D : {
				theme_label : theme_name
			},
			onclick : select_theme
		});
	});
	CeL.new_node(theme_nodes, 'select_theme_panel');
	// Release memory. 釋放被占用的記憶體。
	theme_nodes = null;

	// auto-detect navigator theme
	select_theme(default_configuration.CSS_theme || DEFAULT_THEME_TEXT);
}

// ------------------------------------

function setup_download_sites() {
	// 初始化 initialization: download_site_nodes
	Object.assign(download_site_nodes, {
		link_of_site : Object.create(null),
		node_of_id : Object.create(null)
	});

	var site_nodes = [], type_icon = {
		//
		novel : '📄',
		comic : '🖼️'
	};
	for ( var site_type in download_sites_set) {
		var label_node = CeL.new_node({
			div : [ type_icon[site_type.replace(/\..+$/, '')] || '', {
				T : site_type_description[site_type] || site_type
			} ],
			title : site_type,
			C : 'site_type_label'
		}), label_sites = [];

		var sites = download_sites_set[site_type];
		for ( var site_id in sites) {
			var site_node = CeL.new_node({
				span : sites[site_id],
				C : 'download_sites'
						+ (old_Unicode_support ? ' ' + 'old_Unicode_support'
								: ''),
				title : site_type + '/' + site_id,
				onclick : function() {
					site_used = this.title;
					type_and_language_used = site_used.replace(/\/.+/, '');
					reset_favorites();
					reset_site_options();
				}
			});
			download_site_nodes.push(site_node);
			site_id = site_type + '/' + site_id;
			download_site_nodes.node_of_id[site_id] = site_node;
			label_sites.push({
				div : site_node,
				C : 'click_item'
			});
		}
		label_sites = CeL.new_node({
			div : label_sites,
			S : 'display: none;'
		});
		site_nodes.push(label_node, label_sites);
		set_click_trigger(label_node, label_sites, function() {
			type_and_language_used = this.title;
		});
	}
	CeL.new_node(site_nodes, 'download_sites_list');

	set_click_trigger('download_sites_trigger', 'download_sites_list');
}

// ------------------------------------

// Setup GUI-only options
function setup_download_options() {
	var import_arg_hash = CeL.work_crawler.setup_argument_conditions(
			global_options, true);

	// @seealso function reset_site_options()

	var options_nodes = [], _force_convert;
	// 當前僅有繁體中文已具備所有說明。
	if (force_convert.includes('TW')) {
		_force_convert = force_convert;
	} else {
		_force_convert = force_convert.clone();
		_force_convert.push('TW');
	}

	for ( var download_option in download_options_set) {
		var arg_type_data = import_arg_hash[download_option], input_box = '',
		//
		className = 'download_options'
				+ (arg_type_data && !('boolean' in arg_type_data) ? ' '
						+ 'non_select' : '');

		if (arg_type_data
				&& (('number' in arg_type_data) || ('string' in arg_type_data))) {
			input_box = {
				// will fill by reset_site_options()
				input : null,
				id : download_option + '_input',
				C : arg_type_data ? Object.keys(arg_type_data).map(
						function(type) {
							return 'type_' + type;
						}).join(' ') : '',
				type : arg_type_data && {
					// date : 'date',
					// time:'time',
					// datetime : 'datetime-local',
					// file : 'file',
					number : 'number'
				}[Object.keys(arg_type_data).join()] || 'text',
				// data_type : arg_type_data &&
				// Object.keys(arg_type_data).join(),
				onchange : change_download_option
			};
			if (('string' in arg_type_data)
					&& Array.isArray(arg_type_data.string)
					&& arg_type_data.string.length === 1
					&& typeof arg_type_data.string[0] === 'string') {
				var fso_type = arg_type_data.string[0]
						.match(/^fso_(file|files|directory|directories)$/);
				if (fso_type) {
					fso_type = fso_type[1];
					// 檔案或目錄的路徑常常較長。
					input_box.S = 'width: 30em;';
					input_box = [ input_box, {
						T : '📂',
						R : (old_Unicode_support ? '' : '🗁 ')
						// append dialog
						// gettext_config:{"id":"select-$1-path"}
						+ _('選擇%1路徑', _(fso_type)),
						fso_type : fso_type,
						onclick : select_download_options_fso,
						S : 'cursor: pointer;'
					} ];
				}
			}
		}

		var option_object = {
			label : [ {
				b : download_option
			}, ':', input_box, ' ', {
				T : download_options_set[download_option],
				force_convert : _force_convert
			},
			// option_type_token() @ work_crawler_loader.js
			option_type_token(arg_type_data, [ , '#871' ]) ],
			C : className,
			title : download_option
		};
		if (!className.includes('non_select')) {
			// type: 'boolean'
			option_object.onclick = click_download_option;
		}

		download_options_nodes[download_option] = CeL.new_node(option_object);
		options_nodes.push({
			div : download_options_nodes[download_option],
			C : 'click_item'
		});
	}

	// 獨立的最愛清單 / 圖書館 / 書籤 / 書庫
	var external_favorite_list = get_favorite_list_file_path(get_crawler(null,
			true));
	set_click_trigger('download_options_trigger', CeL.new_node({
		div : [ options_nodes, {
			b : [ '📥', external_favorite_list ? {
				// gettext_config:{"id":"auto-save-download-options-and-favorite-series-list"}
				T : '自動儲存選項設定與最愛作品清單',
				force_convert : force_convert,
				S : 'color: orange;'
			} : {
				// 本次執行期間不儲存選項設定
				// gettext_config:{"id":"auto-save-download-options"}
				T : '自動儲存選項設定',
				force_convert : force_convert
			} ],
			onclick : function() {
				save_config_this_time = !save_config_this_time;
				CeL.info({
					// gettext_config:{"id":"automatic-storage-setting-has-been-enabled"}
					T : save_config_this_time ? '已設定自動儲存選項設定。'
					// gettext_config:{"id":"automatic-storage-setting-has-been-disabled"}
					: '已設定不自動儲存選項設定。'
				});
				CeL.set_class(this, 'not_set', {
					remove : save_config_this_time
				});
			},
			C : 'button' + (save_config_this_time ? '' : ' ' + 'not_set')
		}, {
			b : [ '🔙', external_favorite_list ? {
				// gettext_config:{"id":"reset-download-options-and-favorite-series-list"}
				T : '重設下載選項與最愛作品清單',
				S : 'color: orange;'
			} : {
				// gettext_config:{"id":"reset-download-options"}
				T : '重設下載選項'
			} ],
			onclick : click_reset_download_option,
			C : 'button'
		} ]
	}, 'download_options_panel'));
}

change_download_option.exit = Symbol('exit');

options_post_processor.data_directory = function(value) {
	if (data_directory) {
		change_data_directory(value);
	} else {
		// recovery
		this.value = data_directory;
	}
	// do not save
	return change_download_option.exit;
};

// 可手動指定7z壓縮工具執行檔的路徑。
options_post_processor.archive_program_path = function(value) {
	var path = CeL.archive.remove_fso_path_quote(value);
	if (path && !CeL.storage.file_exists(path)) {
		path = null;
	}

	if (!path) {
		// recovery
		CeL.error('未發現檔案 ' + value + '，回復原值。');
		this.value = default_configuration.archive_program_path;
		return change_download_option.exit;
	}

	value = CeL.archive.add_fso_path_quote(path);
	CeL.archive.executable_file_path[default_configuration.archive_program_type] = value;
	return this.value = value;
};

function change_download_option() {
	var key = this.parentNode.title, value = this.value,
	//
	type = Object.keys(CeL.set_class(this)).map(function(_class) {
		_class = _class.match(/^type_(.+)$/);
		return _class ? _class[1] : '';
	});

	if (key in options_post_processor) {
		value = options_post_processor[key].call(this, value);
		if (value === change_download_option.exit)
			return;
	}

	if (key in global_options) {
		default_configuration[key] = value;
		save_default_configuration();
		return;
	}

	var crawler = get_crawler();
	if (!crawler) {
		return;
	}

	// TODO: parse other values
	if (type.includes('number') && !isNaN(+value)) {
		value = +value;
		if (!isNaN(value))
			crawler.setup_value(key, value);
	} else {
		if ((!type.join('') || type.includes('boolean')
				&& (value === 'true' || value === 'false'))) {
			value = value === 'true';
		} else if (type.includes('string')) {
			// TODO: verify the value
		} else {
			// TODO: verify the value
		}
		crawler.setup_value(key, value);
	}
	value = crawler[key];

	if (key in save_to_preference) {
		crawler.preference.crawler_configuration[key] = value;
		save_preference(crawler);

	} else if (key === 'main_directory') {
		if (!default_configuration[crawler.site_id]) {
			default_configuration[crawler.site_id] = Object.create(null);
		}
		default_configuration[crawler.site_id][key] = value;
		save_default_configuration();
	}
}

function select_download_options_fso() {
	var _this = this, fso_type = this.getAttribute('fso_type'),
	// https://electronjs.org/docs/api/dialog
	properties = {
		file : [ 'openFile' ],
		files : [ 'openFile', 'multiSelections' ],
		directory : [ 'openDirectory' ],
		directories : [ 'openDirectory', 'multiSelections' ]
	}[fso_type]
	// 警告: 照理來說應該指明到底要什麼類別。
	|| [ 'openFile', 'openDirectory', 'multiSelections' ];

	open_dialog({
		properties : properties
	}, function(fso_path_list) {
		if (!fso_path_list || fso_path_list.canceled
				|| !Array.isArray(fso_path_list = fso_path_list.filePaths)) {
			// assert: fso_path_list === null
			CeL.log({
				// gettext_config:{"id":"no-file-or-directory-selected"}
				T : '未選擇檔案或目錄。'
			});
			return;
		}

		// assert: Array.isArray(fso_path_list)
		if (!fso_type.startsWith('file')) {
			// assert: 選擇目錄。自動加上最後的目錄分隔符號。
			fso_path_list = fso_path_list.map(function(fso_path) {
				return CeL.append_path_separator(fso_path);
			});
		}
		CeL.log([ 'select_download_options_fso: ', {
			// gettext_config:{"id":"path-of-$2-selected-$1"}
			T : [ '選擇了%2的路徑：%1', JSON.stringify(fso_path_list), fso_type ]
		} ]);

		var input_box = _this.previousElementSibling;
		CeL.DOM.set_text(input_box, fso_path_list.join('|'));
		// 有改變才 fire event。
		input_box.onchange();
	});
}

function click_download_option(event) {
	CeL.DOM.stop_event(event, true);

	var key = this.title, value;
	if (key in global_options) {
		value = default_configuration[key] = !default_configuration[key];
		save_default_configuration();

	} else {
		var crawler = get_crawler();
		if (!crawler) {
			return;
		}
		crawler.setup_value(key, !crawler[key]);
		value = crawler[key];

		if (key in save_to_preference) {
			crawler.preference.crawler_configuration[key] = value;
			save_preference(crawler);
		}
	}

	CeL.DOM.set_class(this, 'selected', {
		remove : !value
	});

	// 即時更改空格內容。
	// @see function reset_site_options()
	// download_option + '_input'
	CeL.DOM.set_text(key + '_input', value || value === 0 ? value : '');
}

function click_reset_download_option() {
	var crawler = get_crawler();
	if (!crawler) {
		return;
	}
	Object.assign(crawler, crawler.default_save_to_preference);
	crawler.preference.crawler_configuration = Object.create(null);
	// Skip .main_directory

	save_preference(crawler);
	reset_site_options();
	// gettext_config:{"id":"download-options-reset"}
	CeL.info('已重設下載選項。');
}

// ------------------------------------

function setup_DOM_events() {
	if (false) {
		document.addEventListener('drop', function(event) {
			// event.preventDefault();
			console.log(event);
		});
	}

	if (false) {
		CeL.DOM.add_listener('focus', function(event) {
			// console.log(event);

			// 當原先沒有東西的時候就自動貼上系統剪貼簿字串內容。
			if (!CeL.DOM.set_text('input_work_id')) {
				paste_text();
			}
		});
	}

	CeL.get_element('input_work_id').onkeypress = function(this_event) {
		if (this_event.keyCode === 13) {
			start_gui_crawler();
		}
	};

	CeL.get_element('input_work_id').focus();
}

// --------------------------------------------------------------------------------------------------------------------

function set_panel_height(panel) {
	panel = CeL.get_element(panel);

	var style = panel.style;
	// 設定控制面板可改變大小。
	style.resize = 'vertical';
	style.overflow = 'auto';

	var max_height = Math.max(200, window.innerHeight - 90);
	style.height = '';
	if (panel.offsetHeight > max_height) {
		style.height = max_height + 'px';
	}
}

function set_click_trigger(trigger, target_panel, callback) {
	trigger = CeL.get_element(trigger);
	CeL.set_class(trigger, 'trigger');
	CeL.add_listener('click', function on_click_trigger() {
		var display = CeL.toggle_display(target_panel);
		if (display !== 'none') {
			set_panel_height(target_panel);
		}
		CeL.get_element(target_panel).parentElement.style.height = '';
		set_trigger_icon.call(this, {
			display : display
		});
		if (typeof callback === 'function') {
			callback.call(this, target_panel);
		}
		return false;
	}, trigger);

	setTimeout(set_trigger_icon.bind(trigger, {
		initialization : true
	}));
}

function icon_of_trigger(trigger) {
	var icon_node = trigger.firstElementChild;
	if (icon_node) {
		var _class = CeL.DOM.set_class(icon_node);
		if (!_class || !('trigger_icon' in _class))
			icon_node = null;
	}
	return icon_node;
}

function set_trigger_icon(options) {
	var trigger = CeL.get_element(this);

	// trigger.children.length
	var children_count = trigger.childElementCount;

	var icon_node = icon_of_trigger(trigger);

	var need_icon;

	var width = CeL.DOM.get_node_offset(trigger).width;
	// console.log(trigger);
	// console.log(width);

	if (options.initialization && width === 0) {
		// forced show icon for hidden button
		need_icon = true;

	} else if (children_count === 1) {
		need_icon = width
				- (CeL.DOM.get_node_offset(trigger.firstElementChild).width || 0) > 60;

	} else {
		// assert: children_count === 0
		// || children_count > 1
		need_icon = width > (children_count === 0 ? 40 : 200);
	}

	if (!need_icon) {
		if (icon_node) {
			trigger.removeChild(icon_node);
		}
		return;

	}

	var expand_now = options.display !== 'none';
	var icon_text = expand_now ? '📖' : '📕';
	// click to expand
	// gettext_config:{"id":"collapse"}
	var icon_title = _(expand_now ? 'collapse'
	// gettext_config:{"id":"expand"}
	: 'expand');
	if (icon_node) {
		icon_node.title = icon_title;
		CeL.DOM.set_text(icon_node, icon_text);

	} else {
		CeL.new_node({
			div : icon_text,
			R : icon_title,
			C : 'trigger_icon'
		}, [ trigger, 'first' ]);
	}
}

// ----------------------------------------------

function paste_text() {
	// https://electronjs.org/docs/api/clipboard
	var text = require('electron').clipboard.readText();
	if (text) {
		// 貼上系統剪貼簿字串內容。
		CeL.DOM.set_text('input_work_id', text);
		CeL.get_element('input_work_id').focus();
	}
}

function show_fso(fso_path) {
	try {
		// 跳轉至目標資料夾的目錄下，而不只標示出資料夾位置。
		// https://electronjs.org/docs/api/shell
		if (node_electron.shell.openPath) {
			// electron 9.0.0 棄用 shell.openItem，並用異步的 shell.openPath 代替。
			node_electron.shell.openPath(fso_path);
		} else if (node_electron.shell.openItem) {
			// electron@7.3.0
			node_electron.shell.openItem(fso_path);
		} else {
			// + select the file.
			node_electron.shell.showItemInFolder(fso_path);
		}
	} catch (e) {
		CeL.error(String(e) + ': ' + fso_path);
	}

	return false;
}

function open_URL(URL) {
	if (typeof URL !== 'string') {
		URL = this.href;
		if (!URL)
			return false;
	}

	node_electron.shell.openExternal(URL)
	// https://electronjs.org/docs/api/shell
	['catch'](function(error) {
		CeL.error(String(error) + ': ' + URL);
	});

	return false;
}

// TODO: 重設所有網站的下載目錄功能。
// 改變預設主要下載目錄。
function change_data_directory(data_directory) {
	if (!data_directory && original_data_directory) {
		// recovery: 若全部清空將會重設下載目錄。
		data_directory = original_data_directory;
	}

	if (data_directory) {
		// data_directory 必須以 path separator 作結。
		data_directory = CeL.append_path_separator(data_directory);
		var old_data_directory = default_configuration.data_directory;
		for_all_crawler_loaded(function(site_id) {
			if (this.main_directory.startsWith(old_data_directory)) {
				var new_main_directory = this.main_directory.replace(
						old_data_directory, data_directory);
				CeL.info({
					// gettext_config:{"id":"updating-and-setting-up-download-website-for-$1-$2-→-$3"}
					T : [ '同時更改已手動設定下載目錄的網站 %1：%2 → %3', site_id,
							this.main_directory, new_main_directory ]
				});
				this.main_directory = new_main_directory;
			}
		});

		if (CeL.directory_is_empty(old_data_directory)) {
			CeL.warn({
				// gettext_config:{"id":"the-old-download-directory-$1-is-an-empty-directory-so-it-will-be-removed"}
				T : [ '舊下載目錄 "%1" 為空目錄，將之移除。', old_data_directory ]
			});
			CeL.remove_directory(old_data_directory);
		}

		default_configuration.data_directory = data_directory;
		// prepare main download directory: create data_directory if needed.
		// 因為不只是下載時，在編輯最愛列表時也必須寫入到資料目錄中，因此操作完畢就先造出來。
		CeL.create_directory(data_directory);
		reset_site_options();
	}

	// 維護 global.data_directory = default_configuration.data_directory 這兩個值相同。
	global.data_directory = default_configuration.data_directory;
	save_default_configuration();
}

function save_default_configuration() {
	if (!save_config_this_time) {
		CeL.debug([ 'save_default_configuration: ', {
			// gettext_config:{"id":"automatic-storage-setting-has-been-disabled"}
			T : '已設定不自動儲存選項設定。'
		} ], 1);
		return;
	}

	// prepare work directory.
	CeL.create_directory(original_data_directory);

	var data_directory_no_changed = original_data_directory === default_configuration.data_directory;
	if (data_directory_no_changed /* || !default_configuration.data_directory */)
		delete default_configuration.data_directory;
	CeL.write_file(original_data_directory + default_configuration_file_name,
			default_configuration);
	// recovery
	if (data_directory_no_changed)
		default_configuration.data_directory = original_data_directory;
}

// 保存下載偏好選項 + 最愛作品清單
// @private
function save_preference(crawler) {
	if (!save_config_this_time) {
		CeL.debug([ 'save_preference: ', {
			// gettext_config:{"id":"automatic-storage-setting-has-been-disabled"}
			T : '已設定不自動儲存選項設定。'
		} ], 1);
		return;
	}

	// prepare work directory.
	CeL.create_directory(crawler.main_directory);

	var preference = crawler.preference;
	if (get_favorite_list_file_path(crawler)) {
		// 不將最愛作品清單保存到 preference.json
		preference = Object.clone(preference);
		delete preference.favorites;
	}

	CeL.write_file(crawler.main_directory + 'preference.json', preference);
}

function check_favorites_line_separator(favorites) {
	// console.log(favorites);
	return !('line_separator' in favorites)
	//
	|| favorites.line_separator === CeL.env.line_separator ? '' : [ ' ', {
		// 分行
		// gettext_config:{"id":"file-new-line-$1-which-does-not-match-the-system-new-line-$2"}
		T : [ '檔案換行為 %1，和系統換行 %2 不符。',
		//
		JSON.stringify(favorites.line_separator),
		//
		JSON.stringify(CeL.env.line_separator) ]
	}, {
		// gettext_config:{"id":"there-may-be-garbled-characters-when-opening-the-file"}
		T : '開啟檔案時可能會有亂碼。'
	}, {
		b : {
			// gettext_config:{"id":"one-click-fix-file-wrap"}
			T : '一鍵修正檔案換行'
		},
		onclick : function() {
			favorites.line_separator = CeL.env.line_separator;
			// save_favorites(crawler, favorites.toString());
			// gettext_config:{"id":"modified-file-wrap.-you-must-save-a-list-of-favorite-works-to-take-effect"}
			this.innerHTML = _('已修改檔案換行。您必須儲存最愛作品清單才能生效。');
		},
		C : 'favorites_button'
	} ];
}

function edit_favorites(crawler) {
	function click_save_favorites() {
		save_favorites(crawler, favorites_node.value.replace(/\r?\n/g,
		// assert: !!favorites.line_separator === true
		favorites.line_separator || CeL.env.line_separator));
		reset_favorites(crawler);
	}

	var favorites = get_favorites(crawler, true),
	//
	favorites_node = CeL.new_node({
		textarea : null,
		id : 'favorites_box',
		onkeydown : function(event) {
			// console.log(event);
			// Escape
			if (event.keyCode === 27) {
				reset_favorites(crawler);
				return false;
			}
			// Ctrl+Enter
			if (event.keyCode === 13 && event.ctrlKey) {
				click_save_favorites();
				return false;
			}
		}
	});
	if (favorites[favorites.length - 1]) {
		// 在最後添上換行。
		favorites.push('');
	}
	favorites_node.value = favorites_toString(favorites);

	CeL.new_node([ {
		div : {
			// gettext_config:{"id":"enter-one-series-title-or-id-per-line"}
			T : '請在每一行鍵入一個作品名稱或🆔：'
		}
	}, favorites_node, {
		br : null
	}, {
		div : [ {
			// save
			b : [ '💾', {
				// gettext_config:{"id":"save-favorite-series-list"}
				T : '儲存最愛作品清單'
			}, ' (', {
				kbd : 'Ctrl'
			}, '+', {
				kbd : 'Enter'
			}, ')' ],
			onclick : click_save_favorites,
			C : 'favorites_button'
		}, {
			// abandon
			b : [ old_Unicode_support ? '❌' : '🛑', {
				// gettext_config:{"id":"discard-editing-favorite-series-list"}
				T : '放棄編輯最愛作品清單'
			}, ' (', {
				kbd : 'Escape'
			}, ')' ],
			onclick : function() {
				reset_favorites(crawler);
			},
			C : 'favorites_button cancel'
		}, check_favorites_line_separator(favorites) ]
	} ], [ 'favorite_list', 'clean' ]);
	favorites_node.focus();
}

function get_favorite_list_file_path(crawler) {
	if (!crawler)
		return;

	// 儲存最愛作品清單的目錄。
	var favorite_list_file_path = global.favorite_list_directory;

	if (typeof favorite_list_file_path === 'function') {
		favorite_list_file_path = favorite_list_file_path.call(crawler);

	} else if (favorite_list_file_path) {
		CeL.create_directory(favorite_list_file_path);
		favorite_list_file_path += crawler.id + '.txt';
	}

	return favorite_list_file_path;
}

function favorites_toString(favorites) {
	return favorites.hasOwnProperty('toString')
	//
	? favorites.toString() : favorites.join('\n');
}

function append_to_favorites(site_id, work_title) {
	var crawler = get_crawler(site_id),
	// 最愛清單
	favorites = get_favorites(crawler, true);

	work_title = work_title.trim();
	if (favorites.includes(work_title)) {
		// already in favorites
		return;
	}

	if (favorites.length > 0 && favorites[favorites.length - 1] === '') {
		// 避免多了空白行。
		favorites.pop();
	}
	favorites.push(work_title,
	// 加上空白行。
	'');
	favorites = favorites_toString(favorites);
	save_favorites(crawler, favorites);
}

function get_favorites(crawler, get_parsed, remove_list) {
	if (!crawler)
		crawler = get_crawler();

	var favorite_list_file_path = get_favorite_list_file_path(crawler);
	if (!favorite_list_file_path)
		return crawler.preference.favorites || [];

	var work_list_text = CeL.read_file(favorite_list_file_path), work_list;
	if (work_list_text && (work_list_text = work_list_text.toString()).trim()) {
		// 有東西。
		work_list = CeL.work_crawler.parse_favorite_list(work_list_text, {
			get_parsed : get_parsed || !!remove_list,
			remove : remove_list
		});
		return get_parsed ? work_list.parsed : work_list;
	}

	work_list = crawler.preference.favorites;
	if (Array.isArray(work_list) && work_list.length > 0) {
		CeL.info({
			// gettext_config:{"id":"favorite-series-list-not-found-or-empty.-using-old-favorite-series-list"}
			T : '儲存最愛作品清單的檔案不存在或者沒有內容。採用舊有的最愛作品列表。'
		});
		return work_list;
	}

	return [];
}

function save_favorites(crawler, work_list_text) {
	if (!crawler)
		crawler = get_crawler();

	var work_list = CeL.work_crawler.parse_favorite_list(work_list_text);

	// 將喜愛的作品名單存放在 .preference
	// Store your favorite work list in .preference
	crawler.preference.favorites = work_list;

	var favorite_list_file_path = get_favorite_list_file_path(crawler);
	if (!favorite_list_file_path) {
		save_preference(crawler);
		return;
	}

	crawler.write_favorite_list(work_list_text, favorite_list_file_path);
}

function remove_favorite(crawler, work_title) {
	var favorite_list_file_path = get_favorite_list_file_path(crawler);
	if (!favorite_list_file_path) {
		crawler.preference.favorites = crawler.preference.favorites
		//
		.filter(function(title) {
			return title !== work_title;
		});
		return;
	}

	var favorites = get_favorites(crawler, true, work_title);
	save_favorites(crawler, favorites_toString(favorites));
}

// 當遇到幾百個書籤，按鈕會卡卡的。
var read_work_data_limit = 50;
function reset_favorites(crawler) {
	if (!crawler)
		crawler = get_crawler();

	var favorites = get_favorites(crawler),
	// search cache
	search_result = crawler.get_search_result();

	function get_id_of_title(work_title, is_id) {
		var work_id = is_id ? work_title : search_result[work_title];
		if (work_id !== undefined && crawler.id_of_search_result) {
			work_id = typeof crawler.id_of_search_result === 'function'
			// @see function finish(no_cache) @ work_crawler.js
			? crawler.id_of_search_result(work_id)
					: work_id[crawler.id_of_search_result];
		}
		return work_id;
	}

	var finished_work_title_list = [];
	var favorites_nodes = favorites.map(function(work_title) {
		var nodes = [ {
			a : work_title,
			href : '#',
			onclick : function() {
				add_new_download_job(crawler, work_title);
				return false;
			}
		} ];

		var work_id, input_id;
		if (!search_result) {
		} else {
			if (work_id = search_result[work_title]) {
				work_id = get_id_of_title(work_title);
			} else {
				for ( var title in search_result) {
					// NG: "===": 可能有類型轉換的問題。
					if (work_title == get_id_of_title(title)) {
						input_id = true;
						work_id = work_title;
						work_title = title;
						break;
					}
				}
			}
			if (!work_id) {
				// 之前有下載成功過這些作品，應該就會變成藍色的了。
				nodes[0].S = 'color: #c00;';

			} else if (favorites.length < read_work_data_limit
					|| crawler.read_work_data) {
				// @see work_data.directory @ function
				// process_work_data(XMLHttp) @ work_crawler.js
				var work_directory_name = work_id + ' ' + work_title;
				var work_directory = crawler.main_directory
						+ work_directory_name;
				if (CeL.directory_exists(work_directory)) {
					nodes.push({
						span : '📂',
						R : (old_Unicode_support ? '' : '🗁 ')
						// gettext_config:{"id":"open-download-folder"}
						+ _('開啓作品下載目錄'),
						onclick : function() {
							show_fso(work_directory);
						},
						S : 'cursor: pointer;'
					});

					var work_data = CeL.get_JSON(
					//
					CeL.append_path_separator(work_directory)
					//
					+ work_directory_name + '.json');
					// console.log(work_data);
					if (crawler.is_finished(work_data)) {
						nodes.push({
							span : '👌',
							// gettext_config:{"id":"series-has-ended"}
							R : _('作品已完結。')
							//
							+ (work_data.last_update ? '\nlast_update: '
							//
							+ work_data.last_update : '')
							//
							+ (work_data.last_download ? '\nlast_download: '
							//
							+ work_data.last_download.date : '')
						});
						if (work_data.last_download
						// add finished 並且檢測上次下載與上次作品更新
						&& (!Date.parse(work_data.last_download.date)
						//
						|| CeL.to_millisecond('200D') < Date.now()
						//
						- Date.parse(work_data.last_download.date))
						//
						&& (!Date.parse(work_data.last_update)
						//
						|| CeL.to_millisecond('200D') < Date.now()
						//
						- Date.parse(work_data.last_update))) {
							finished_work_title_list.push(work_title);
						}
					}
				}
			}
		}

		// add 解析及操作列表檔案的功能。
		nodes.push({
			b : '✗',
			// 從最愛名單中刪除本作品。
			// gettext_config:{"id":"remove-series-from-favorite-series-list"}
			R : _('從最愛名單中注解掉本作品。'),
			onclick : function() {
				remove_favorite(crawler, input_id ? work_id : work_title);
				reset_favorites(crawler);
			},
			S : 'color: red; cursor: pointer;'
		});

		return {
			li : nodes,
			title : work_id || ''
		};
	});

	if (finished_work_title_list.length > 0) {
		CeL.info({
			// gettext_config:{"id":"$1-ended-series-or-id-$2"}
			T : [ '%1 已完結的作品名稱或🆔：%2', crawler.site_name || crawler.site_id,
					finished_work_title_list.join(', ') ]
		});
	}

	var average_length = Math.round(favorites.reduce(function(len, now) {
		return len + now.length;
	}, 0) / favorites.length);
	favorites_nodes = [ favorites.length > 0 ? {
		ol : favorites_nodes,
		C : 'favorite_ol',
		// 35: 全螢幕下一垂直行舒適排列之列數。
		S : 'column-count: ' + Math.min(Math.ceil(favorites.length / 35),
		// e.g., avg 1: 10
		// 2: 9
		// 3: 8
		// 4: 7
		// 5: 6
		// 6: 5
		// 7: 4
		average_length < 8 ? 11 - average_length
		// 10+2: 3
		// 15+2: 2
		// 20+2: 1
		: Math.max(1, 5 - ((average_length - 2) / 5 | 0)))
	} : '', {
		div : [ favorites.length > 0 ? {
			b : [ '✅', {
				// gettext_config:{"id":"check-and-download-updates-of-all-favorite-series"}
				T : '檢查所有最愛作品之更新，並下載更新作品。'
			} ],
			onclick : function() {
				favorites.forEach(function(work_title) {
					add_new_download_job(crawler, work_title, true);
				});
			},
			C : 'favorites_button'
		} : favorites.comments > 0 || favorites.blank > 0
		//
		|| favorites.duplicated > 0 ? {
			// gettext_config:{"id":"there-is-no-favorite-series-list"}
			T : '🈳 尚無最愛作品。'
		} : {
			// gettext_config:{"id":"favorite-series-list-is-empty"}
			T : '🈳 尚未設定最愛作品。'
		}, {
			// 📝 我的最愛
			b : [ '✍️', {
				// gettext_config:{"id":"edit-favorite-series-list"}
				T : '編輯最愛作品清單'
			} ],
			onclick : function() {
				edit_favorites(crawler);
			},
			C : 'favorites_button'
		}, favorites.comments > 0 || favorites.blank > 1
		//
		|| favorites.duplicated > 0 ? {
			// abandon
			b : [ old_Unicode_support ? '❌' : '🛑', {
				// gettext_config:{"id":"delete-all-$1-annotations-$2-repetitions-and-$3-blank-lines"}
				T : [ '刪除所有%1個注解、%2個重複與%3個空白行。',
				//
				favorites.comments, favorites.duplicated, favorites.blank ]
			} ],
			onclick : function() {
				save_favorites(crawler, crawler.preference
				//
				.favorites.join(CeL.env.line_separator));
				reset_favorites(crawler);
			},
			C : 'favorites_button cancel'
		} : '', favorites.duplicated > 0 ? [ ' ', {
			// gettext_config:{"id":"there-are-$1-duplicate-titles-or-ids-in-the-list"}
			T : [ '列表檔案中有%1個重複作品名稱或 id。', favorites.duplicated ]
		}, {
			// 我的最愛
			b : [ '🔨', {
				// 重新整理列表檔案
				// gettext_config:{"id":"annotate-duplicate-work-names-or-id"}
				T : '注解掉重複的作品名稱或🆔',
			} ],
			onclick : function() {
				crawler.parse_favorite_list_file(
				//
				get_favorite_list_file_path(crawler), true);
				reset_favorites(crawler);
			},
			C : 'favorites_button'
		}, {
			// 我的最愛
			b : [ '❌', {
				// gettext_config:{"id":"delete-duplicate-work-names-or-id"}
				T : '刪除重複的作品名稱或🆔'
			} ],
			onclick : function() {
				crawler.parse_favorite_list_file(
				//
				get_favorite_list_file_path(crawler), function(parsed) {
					// 直接把最後一個消掉。
					parsed.pop();
				});
				reset_favorites(crawler);
			},
			C : 'favorites_button'
		} ] : '', finished_work_title_list.length > 0 ? {
			b : [ '❌', {
				// gettext_config:{"id":"commented-out-$1-finished-work-names-or-id"}
				T : [ '注解掉%1個已完結的作品名稱或🆔', finished_work_title_list.length ]
			} ],
			onclick : function() {
				remove_favorite(crawler, finished_work_title_list);
				reset_favorites(crawler);
			},
			C : 'favorites_button'
		} : '',
		// check_favorites_line_separator(favorites)
		]
	}, favorites.length < read_work_data_limit
	//
	|| crawler.read_work_data ? '' : [ {
		b : [ '⌛️', {
			// gettext_config:{"id":"reading-the-website-information-file-of-this-website-to-determine-whether-the-work-has-been-downloaded-and-completed"}
			T : '讀取本網站作品資訊檔案以判別作品是否已下載過、是否完結。'
		}, {
			// gettext_config:{"id":"when-choosing-a-website-it-can-cause-few-seconds-of-unresponsiveness"}
			T : '選擇網站時，這可能造成幾十秒鐘無回應。',
			S : 'color: red;'
		} ],
		onclick : function() {
			crawler.read_work_data = true;
			reset_favorites(crawler);
		},
		C : 'favorites_button'
	}, {
		b : [ '⌛️', {
			// gettext_config:{"id":"reading-the-work-information-from-all-websites"}
			T : '讀取所有網站之作品資訊檔案',
			S : 'color: red;'
		} ],
		onclick : function() {
			read_work_data_limit = Infinity;
			reset_favorites(crawler);
		},
		C : 'favorites_button'
	} ] ];

	// console.log(favorites_nodes);
	CeL.new_node(favorites_nodes, [ 'favorite_list', 'clean' ]);
}

function reset_site_options() {
	download_site_nodes.forEach(function(site_node) {
		CeL.set_class(site_node, 'selected', {
			remove : site_node.title !== site_used
		});
	});

	// re-draw download options
	var crawler = get_crawler();
	for ( var download_option in download_options_nodes) {
		var download_options_node = download_options_nodes[download_option],
		//
		arg_type_data = CeL.work_crawler.prototype.import_arg_hash[download_option],
		//
		arg_types = arg_type_data && Object.keys(arg_type_data).join();

		if (!CeL.has_class(download_options_node, 'non_select')) {
			CeL.set_class(download_options_node, 'selected', {
				// 只要為可選擇之選項，便依照是否為空值設定選擇狀態。
				// assert: 純粹為數字或者字串則不設定 'selected'。
				remove : !crawler[download_option]
			});
		}

		var value = download_option in global_options ? default_configuration[download_option]
				: crawler[download_option] || crawler[download_option] === 0 ? crawler[download_option]
						: '';
		CeL.DOM.set_text(download_option + '_input', value, {
			// 自動調整輸入框大小。
			resize : true,
			min_width : 80,
			max_width : 800
		});
	}
}

// will called by setup_crawler() @ work_crawler_loader.js
function prepare_crawler(crawler, crawler_module) {
	var site_id = site_used;
	if (site_id in download_site_nodes.link_of_site) {
		// 已經初始化過了。
		// 因為 setup_crawler() 只執行一次，因此照理來說不會到這邊來。
		return;
	}

	// 初始化 initialization: crawler
	crawler.site_id = site_id;

	/**
	 * 會從以下檔案匯入使用者 preference:<code>
	# work_crawler_loader.js
	# work_crawler.default_configuration.js → work_crawler.configuration.js
	#
	# → site_configuration
	# global.original_data_directory + default_configuration_file_name → default_configuration
	# site script .js → crawler.*
	# setup_crawler.prepare() call setup_crawler.prepare() call default_configuration[site_id] → crawler.*
	# crawler.main_directory + 'preference.json' → crawler.preference
	 </code>
	 * 
	 * TODO: 將 default_configuration_file_name 轉入 work_crawler_loader.js
	 */

	// 在這邊引入最重要的設定是儲存的目錄 crawler.main_directory。
	// 在引入 crawler.main_directory 後，可以讓網站腳本檔案採用新的設定，把檔案儲存在最終的儲存目錄下。
	// 有些 crawler script 會 cache 網站整體的設定，如 .js 檔案，以備不時之需。因為是 cache，就算刪掉了也沒關係。
	// 只是下次下載的時候還會再重新擷取並且儲存一次。
	if (default_configuration[site_id]) {
		// e.g., crawler.main_directory
		CeL.info({
			T : [ 'import configuration of %1: %2', site_id,
					JSON.stringify(default_configuration[site_id]) ]
		});
		Object.assign(crawler, default_configuration[site_id]);
	}

	crawler.preference = Object.assign({
		// 因為會'重設下載選項'，一般使用不應 cache 這個值。
		crawler_configuration : Object.create(null),
		// 我的最愛 my favorite 書庫 library
		favorites : []
	}, CeL.get_JSON(crawler.main_directory + 'preference.json'));

	// import crawler.preference.crawler_configuration
	var crawler_configuration = crawler.preference.crawler_configuration;
	crawler.default_save_to_preference = Object.create(null);
	Object.keys(save_to_preference).forEach(function(key) {
		// Skip .main_directory
		crawler.default_save_to_preference[key] = crawler[key];
		if (key in crawler_configuration) {
			CeL.info({
				T : [ 'import preference of %1: %2', site_id,
				//
				key + '=' + crawler_configuration[key] + '←' + crawler[key] ]
			});
			crawler[key] = crawler_configuration[key];
		}
	});

	crawler.download_queue = [];
	if (!crawler.site_name) {
		crawler.site_name = download_site_nodes.node_of_id[site_id].innerText;
	}
	download_site_nodes.link_of_site[site_id] = crawler.base_URL;
	// add link to site
	CeL.new_node([ ' ', {
		a : [ '🔗', {
			// 作品平臺連結 (略稱)
			// gettext_config:{"id":"link"}
			T : '連結'
		} ],
		// gettext_config:{"id":"link"}
		R : _('連結'),
		href : crawler.base_URL,
		onclick : open_URL
	} ], download_site_nodes.node_of_id[site_id].parentNode);
}

setup_crawler.prepare = prepare_crawler;

// ----------------------------------------------
// 搜尋功能。

var search_result_columns = {
	No : null,

	// gettext_config:{"id":"work_crawler-search_result_columns-site"}
	'work_crawler-search_result_columns-site' : function(crawler, work_data,
			work_title) {
		return {
			b : crawler.site_name ? {
				span : crawler.site_name
			} : crawler.site_id,
			title : crawler.site_id,
			onclick : function() {
				add_new_download_job(get_crawler(this.title), work_title);
			},
			C : 'download_searched'
		};
	},

	// gettext_config:{"id":"work_crawler-search_result_columns-title"}
	'work_crawler-search_result_columns-title' : [
	// gettext_config:{"id":"only-if-the-title-of-the-obtained-work-is-special-and-different-from-the-title-of-the-work-in-question-will-it-be-marked"}
	'僅於所獲得之作品標題特殊，不同於所查詢之作品標題時，才會標示。',
	//
	function(crawler, work_data, work_title) {
		return work_data.title && work_data.title.trim() === work_title.trim()
		//
		? '' : work_data.title;
	} ],

	// gettext_config:{"id":"work_crawler-search_result_columns-author"}
	'work_crawler-search_result_columns-author' : function(crawler, work_data) {
		return {
			small : work_data.author
		};
	},

	// gettext_config:{"id":"work_crawler-search_result_columns-favorite"}
	'work_crawler-search_result_columns-favorite' : [
	// gettext_config:{"id":"work_crawler-favorite_list_label"}
	'work_crawler-favorite_list_label', function(crawler, work_data) {
		var favorite_list = get_favorites(crawler);
		// ✓
		return favorite_list.includes(work_data.title) ? '😘' : {
			span : '➕',
			title : crawler.site_id,
			onclick : function() {
				// var work_data = work_data_search_queue[this.title];

				append_to_favorites(this.title,
				//
				work_data.title || work_data.id);
				this.innerHTML = '😘';
				this.onclick = null;
				this.style.cursor = '';
			},
			S : 'cursor: pointer;'
		};
	} ],

	// gettext_config:{"id":"work_crawler-search_result_columns-chapters"}
	'work_crawler-search_result_columns-chapters' : [
	// gettext_config:{"id":"number-of-chapters"}
	'章節數量', function(crawler, work_data) {
		this.S = 'text-align: right;';
		return work_data.chapter_count;
	} ],

	// gettext_config:{"id":"work_crawler-search_result_columns-once-downloaded"}
	'work_crawler-search_result_columns-once-downloaded' : [
	// gettext_config:{"id":"mark-the-last-chapter-you-downloaded"}
	'當之前下載過時，標示上次下載到第幾章節。', function(crawler, work_data) {
		this.title = crawler.site_id;
		return work_data.last_download
		//
		&& work_data.last_download.chapter >= 1 ? [ {
			span : work_data.last_download.chapter,
			title : new Date(work_data.last_download.date).format(),
			C : work_data.last_download.chapter
			//
			=== work_data.chapter_count ? '' : 'different',
		}, {
			span : '📂',
			R : (old_Unicode_support ? '' : '🗁 ')
			// gettext_config:{"id":"open-download-folder"}
			+ _('開啓作品下載目錄'),
			onclick : function() {
				// var work_data =
				// work_data_search_queue[this.parentNode.title];

				show_fso(work_data.directory);
			},
			S : 'cursor: pointer;'
		} ] : '';
	} ],

	// gettext_config:{"id":"work_crawler-search_result_columns-restricted"}
	'work_crawler-search_result_columns-restricted' : [
	// gettext_config:{"id":"some-chapters-need-to-be-paid-locked-restricted"}
	'部份章節需要付費/被鎖住/被限制', function(crawler, work_data) {
		// 💰
		return work_data.some_limited ? '🔒' : '';
	} ],

	// gettext_config:{"id":"work_crawler-search_result_columns-completed"}
	'work_crawler-search_result_columns-completed' : [
	// gettext_config:{"id":"series-has-ended"}
	'作品已完結。', function(crawler, work_data) {
		return crawler.is_finished(work_data) ? '👌' : '';
	} ],

	// gettext_config:{"id":"work_crawler-search_result_columns-status"}
	'work_crawler-search_result_columns-status' : [
	// gettext_config:{"id":"status-of-work"}
	'作品狀況', function(crawler, work_data) {
		var status = work_data.status,
		//
		href = crawler.full_URL(crawler.work_URL, work_data.id);
		if (Array.isArray(status)) {
			// tags
			status = status.join();
		} else if (status) {
			status = status.replace(/[\s,;.，；。]+$/, '');
		}
		status = status || '❓';
		return Array.isArray(href) ? {
			// 對於必須要POST才能獲得的網址，不設定連結。
			span : status,
			R : work_data.id
		} : {
			a : status,
			R : work_data.id,
			href : crawler.full_URL(href),
			onclick : open_URL
		};
	} ],

	// gettext_config:{"id":"work_crawler-search_result_columns-lastest"}
	'work_crawler-search_result_columns-lastest' : [
	// gettext_config:{"id":"lastest-chapter"}
	'最新章節', function(crawler, work_data) {
		var node = work_data.latest_chapter && work_data.latest_chapter
		// 不需包含作品標題
		.replace(work_data.title, '');
		if (node && work_data.fill_from_chapter_list)
			node = [ {
				span : old_Unicode_support ? '' : '🧩',
				// gettext_config:{"id":"information-from-the-list-of-chapters"}
				R : _('資訊來自章節清單')
			}, node ];
		else
			node = node || work_data.last_update;

		node = work_data.latest_chapter_url
		//
		&& !Array.isArray(work_data.latest_chapter_url) ? [ {
			a : node,
			href : crawler.full_URL(work_data.latest_chapter_url),
			onclick : open_URL
		}, node === work_data.last_update ? '' : {
			sub : work_data.last_update,
		} ] : {
			span : node
		};

		return node;
	} ],

};

function show_search_result(work_data_search_queue) {
	var work_title = work_data_search_queue.work_title, not_found_site_hash = Object
			.create(null), OK = 0, node_list = [], result_columns = [];
	delete work_data_search_queue.work_title;
	search_result_columns.No = function() {
		this.S = 'text-align: right;';
		return ++OK;
	};

	// title
	for ( var column_title in search_result_columns) {
		var column_generator = search_result_columns[column_title],
		//
		title = {
			T : column_title
		};
		if (Array.isArray(column_generator)) {
			title.R = _(column_generator[0]);
			column_generator = column_generator[1];
		}
		// assert: typeof column_generator === 'function'
		result_columns.push(column_generator);
		node_list.push({
			th : title
		});
	}

	// content lines
	for ( var site_id in work_data_search_queue) {
		var work_data = work_data_search_queue[site_id];
		if (!work_data || !(work_data.chapter_count >= 0)) {
			not_found_site_hash[site_id] = null;
			continue;
		}

		var crawler = get_crawler(site_id);
		node_list.push({
			tr : result_columns.map(function(column_generator) {
				var cell = {
					td : null
				};
				cell.td = column_generator.call(cell, crawler, work_data,
						work_title);
				return cell;
			})
		});
	}

	// footer
	if (OK > 0) {
		node_list = [ {
			table : node_list
		}, {
			// gettext_config:{"id":"click-on-the-website-name-to-download-this-work-on-this-website"}
			T : '點擊網站名稱可下載此網站之本作品。'
		}, {
			br : null
		} ];
	} else {
		node_list = [ {
			// gettext_config:{"id":"this-work-was-not-found-on-all-websites"}
			T : '所有網站都未能找到本作品。'
		} ];
	}

	node_list.unshift({
		// gettext_config:{"id":"search-results-for-$1"}
		T : [ '搜尋作品[%1]之結果：',
		// '<b>' + work_title + '</b>'
		work_title ]
	});

	// ------------------------------------------

	if (OK > 0) {
		node_list.push({
			// save
			b : [ '📥', {
				// gettext_config:{"id":"download-all-works-found-on-$1-websites"}
				T : [ '下載所有%1個網站找到的作品', OK ]
			} ],
			onclick : function() {
				for ( var site_id in work_data_search_queue) {
					if (site_id in not_found_site_hash)
						continue;

					var work_data = work_data_search_queue[site_id];
					var crawler = get_crawler(site_id);
					add_new_download_job(crawler, work_data.title
							|| work_data.id);
				}
			},
			C : 'button'
		}, {
			// add, append
			b : [ {
				span : '➕',
				S : old_Unicode_support ? 'color: #888;' : ''
			}, {
				// gettext_config:{"id":"add-all-the-works-found-on-$1-websites-to-the-website-s-favorite-list"}
				T : [ '將所有%1個網站找到的作品全部加入網站各自之最愛清單', OK ]
			} ],
			onclick : function() {
				for ( var site_id in work_data_search_queue) {
					append_to_favorites(site_id, work_title);
				}
			},
			C : 'button'
		}, {
			b : [ '📥😘', {
				// gettext_config:{"id":"download-all-work-from-favorite-lists"}
				T : '下載所有最愛清單中的本作品'
			} ],
			onclick : function() {
				for ( var site_id in work_data_search_queue) {
					if (site_id in not_found_site_hash)
						continue;

					var work_data = work_data_search_queue[site_id];
					var crawler = get_crawler(site_id);
					var favorite_list = get_favorites(crawler);
					var title = work_data.title || work_data.id;
					if (favorite_list.includes(title))
						add_new_download_job(crawler, title);
				}
			},
			C : 'button'
		});
	}

	// ------------------------------------------

	if (!CeL.is_empty_object(not_found_site_hash)) {
		var not_found_list = Object.keys(not_found_site_hash),
		//
		status_hash = Object.create(null);
		node_list.push({
			hr : null
		}, {
			// gettext_config:{"id":"the-following-$1-websites-could-not-find-this-work"}
			T : [ '以下%1個網站未能找到本作品：', not_found_list.length ]
		});

		not_found_list.forEach(function(site_id, index) {
			var status = work_data_search_queue[site_id];
			status = status && status.process_status || JSON.stringify(status);
			if (status in status_hash) {
				status_hash[status].push(site_id);
			} else {
				status_hash[status] = [ site_id ];
			}
		});

		not_found_list = [ {
			tr : [ {
				th : {
					// gettext_config:{"id":"error-reason"}
					T : '錯誤原因'
				}
			}, {
				th : {
					// gettext_config:{"id":"website-of-the-work"}
					T : '作品網站'
				},
				S : 'max-width: 50%;'
			} ]
		} ];
		Object.keys(status_hash).forEach(function(reason) {
			not_found_list.push({
				tr : [ {
					td : {
						T : reason
					}
				}, {
					td : status_hash[reason].map(function(site_id) {
						return {
							span : [ site_id.replace(/^.+?\//, ''), ' ', {
								b : get_crawler(site_id).site_name
							}, ' ' ],
							C : 'not_found_site'
						};
					})
				} ]
			});
		});

		node_list.push({
			table : not_found_list
		});

		// Release memory. 釋放被占用的記憶體。
		status_hash = not_found_list = null;
	}

	CeL.remove_all_child('search_results');
	CeL.new_node(node_list, 'search_results');
	// Release memory. 釋放被占用的記憶體。
	node_list = null;
	delete CeL.get_element('search_results').running;
}

var type_and_language_used;
// 自動搜尋不同的網站並選擇下載作品。
function search_work_title() {
	// 點選 語言
	// gettext_config:{"id":"please-specify-the-category-of-the-item-you-want-to-search-in-the-online-production-area"}
	if (test_and_attention('請先在網路作品區指定要搜尋的作品類別。', !type_and_language_used)) {
		return;
	}

	// 搜尋名稱用於跨網站。僅能搜尋作品名稱，無法搜尋作品id。
	// 另外假如您已知作品id，可以直接在最愛作品清單輸入id，用不著搜尋。
	var work_title = CeL.node_value('#input_work_id').trim();
	// gettext_config:{"id":"input-series-name-first"}
	if (test_and_attention('請先輸入作品名稱。', !work_title)) {
		CeL.get_element('input_work_id').focus();
		return;
	}

	var sites = CeL.get_element('search_results');
	// gettext_config:{"id":"searching-for-$1-you-must-cancel-the-current-search-process-before-you-can-search-again"}
	if (test_and_attention([ '正在搜尋[%1]中，必須先取消當前的搜尋程序才能重新搜尋。', work_title ],
			sites.running)) {
		return;
	}
	sites.running = work_title;

	var guessed_language = CeL.guess_text_language(work_title);
	if (!type_and_language_used.endsWith(guessed_language)) {
		CeL.warn({
			// gettext_config:{"id":"the-language-used-by-title-seems-to-be-$1-but-it-was-set-to-$2"}
			T : [ '作品名稱之語言似乎為%1，但指定了%2。', guessed_language,
					type_and_language_used ]
		});
	}

	CeL.remove_all_child('search_results');
	CeL.new_node([ {
		// gettext_config:{"id":"searching-for-$1"}
		T : [ '正在搜尋[%1]中……', work_title ]
	}, {
		span : {
			// gettext_config:{"id":"there-are-no-website-returns-yet"}
			T : '尚無任何網站回傳結果……'
		},
		id : 'searching_process'
	}, {
		div : '',
		id : 'still_searching'
	}, {
		b : {
			// gettext_config:{"id":"cancel-search"}
			T : '取消搜尋'
		},
		onclick : function() {
			CeL.toggle_display('search_results_panel', false);
			work_data_search_queue = null;
			CeL.remove_all_child('search_results');
			delete CeL.get_element('search_results').running;
		},
		C : 'button'
	}, {
		b : {
			// gettext_config:{"id":"abandon-the-website-that-has-not-yet-completed-the-search"}
			T : '放棄還沒搜尋完成的網站'
		},
		onclick : function() {
			work_data_search_queue.work_title = work_title;
			show_search_result(work_data_search_queue);
			work_data_search_queue = null;
		},
		C : 'button'
	} ], 'search_results');

	sites = download_sites_set[type_and_language_used];
	sites = Object.keys(sites);
	var work_data_search_queue = Object.create(null), site_count = sites.length, done = 0, found = 0;
	sites.forEach(function(site_id) {
		function all_done(work_data) {
			if (!work_data_search_queue) {
				// canceled
				return true;
			}

			work_data_search_queue[site_id] = work_data;
			// for debug
			if (CeL.is_debug())
				console.log(work_data);
			// work_data maybe `undefined`
			if (work_data && work_data.chapter_count >= 0)
				found++;
			if (++done === site_count) {
				// all done
				work_data_search_queue.work_title = work_title;
				show_search_result(work_data_search_queue);
				return true;
			}
		}

		site_id = type_and_language_used + '/' + site_id;
		var crawler = get_crawler(site_id), chapter_time_interval = crawler
				.get_chapter_time_interval('search');
		CeL.debug(crawler.site_id + ' chapter_time_interval: '
				+ chapter_time_interval);
		if (chapter_time_interval > 60 * 1000) {
			all_done({
				// gettext_config:{"id":"this-website-is-forced-to-wait-too-long-and-is-not-searched-for-anti-blocking"}
				process_status : [ '本網站強制等待時間過長，為防封鎖不作搜尋。' ]
			});
			return;
		}

		crawler.data_of(work_title, function got_work_data(work_data) {
			if (all_done(work_data)) {
				return;
			}

			CeL.remove_all_child('searching_process');
			CeL.new_node({
				// gettext_config:{"id":"completed-$1"}
				T : [ '已完成 %1', found + ' / ' + done + ' / ' + site_count ]
			}, 'searching_process');

			if (site_count - done < 12) {
				var still_searching = sites.filter(function(site_id) {
					return !((type_and_language_used + '/' + site_id)
					//
					in work_data_search_queue);
				});

				CeL.remove_all_child('still_searching');
				CeL.new_node({
					// gettext_config:{"id":"$1-sites-are-still-searching-$2"}
					T : [ '%1個網站仍在搜尋中：%2', still_searching.length,
							still_searching.join(', ') ]
				}, 'still_searching');
			}
		});
	});
	CeL.toggle_display('search_results_panel', true);
}

// ----------------------------------------------

var crawler_loaded = Object.create(null);

function for_all_crawler_loaded(operator) {
	for ( var site_id in crawler_loaded) {
		operator.call(crawler_loaded[site_id], site_id);
	}
}

function get_crawler(site_id, just_test) {
	site_id = site_id || site_used;
	// gettext_config:{"id":"please-specify-site-to-download-first"}
	var attention_message = '請先指定要下載的網站。';
	if (!site_id) {
		if (!just_test) {
			show_attention({
				b : {
					T : attention_message
				}
			}, attention_message);
		}
		return;
	}
	hide_attention_panel(attention_message);

	var crawler = base_directory + site_id + '.js';
	CeL.debug({
		// gettext_config:{"id":"current-path-$1"}
		T : [ '當前路徑：%1', CeL.storage.working_directory() ]
	}, 1, 'get_crawler');
	CeL.debug({
		// gettext_config:{"id":"load-and-use-the-download-tool-$1"}
		T : [ '載入並使用下載工具 %1', crawler ]
	}, 1, 'get_crawler');

	var old_site_used = site_used;
	// Will used in function prepare_crawler()
	site_used = site_id;

	// include site script .js
	// 這個過程會執行 setup_crawler() @ work_crawler_loader.js
	// 以及 setup_crawler.prepare()
	crawler = require(crawler);
	crawler_loaded[site_id] = crawler;
	if (old_site_used !== site_used) {
		// recover
		site_used = old_site_used;
	} else {
		CeL.toggle_display('favorites_panel', true);
		CeL.toggle_display('download_options_panel', true);
		set_panel_height('favorites_panel');
		// gettext_config:{"id":"select-download-tool-$1"}
		process.title = _('選擇下載工具：%1', crawler.site_id);
	}

	// assert: (site_id in download_site_nodes.link_of_site)

	return crawler;
}

// 一個 {Download_job} 只會配上一個作品。不同作品會用到不同的 {Download_job}。
function Download_job(crawler, work_id) {
	// and is crawler id
	this.crawler = crawler;
	this.id = crawler.site_id;
	this.work_id = work_id;
	// 顯示下載進度條。
	this.progress_layer = CeL.new_node({
		div : {
			// gettext_config:{"id":"download-task-initialization-reading-work-information"}
			T : '下載任務初始化、讀取作品資訊中……'
		},
		C : 'progress_layer'
	});
	var this_job = this;
	// console.log(crawler);
	this.layer = CeL.new_node({
		div : [ {
			b : [ {
				span : crawler.site_name ? {
					span : crawler.site_name,
					R : crawler.site_id
				} : crawler.site_id,
				C : 'site_label'
			}, {
				span : work_id,
				R : work_id
			} ],
			C : 'task_label'
		}, {
			div : this.progress_layer,
			S : 'flex-grow: 1; background-color: #888;'
		}, {
			span : [ old_Unicode_support ? '' : '⏸', {
				// 暫停下載 (略稱)
				// gettext_config:{"id":"stop"}
				T : '暫停'
			} ],
			R : (old_Unicode_support ? '' : '⏯ ')
			// gettext_config:{"id":"pause-resume"}
			+ _('暫停/恢復下載') + '\n'
			// gettext_config:{"id":"it-will-not-react-immediately-and-will-wait-until-the-current-chapter-is-processed"}
			+ _('不會馬上反應，將等到當前的章節處理完畢才處理。'),
			C : 'task_controller',
			onclick : function(event) {
				return pause_resume_job(this, this_job);
			}
		}, {
			span : [ {
				b : '✘',
				S : 'color: red;'
			}, {
				// 取消下載 (略稱)
				// gettext_config:{"id":"cancel"}
				T : '取消'
			} ],
			// gettext_config:{"id":"cancel-download"}
			R : _('取消下載') + '\n'
			// gettext_config:{"id":"it-will-not-react-immediately-and-will-wait-until-the-current-chapter-is-processed"}
			+ _('不會馬上反應，將等到當前的章節處理完畢才處理。'),
			C : 'task_controller',
			onclick : cancel_task.bind(null, this_job)
		}, {
			span : '📂',
			R : (old_Unicode_support ? '' : '🗁 ')
			// gettext_config:{"id":"open-download-folder"}
			+ _('開啓作品下載目錄'),
			C : 'task_controller',
			onclick : open_download_directory.bind(null, this)
		} ],
		C : 'download_work_layer'
	}, 'download_job_queue');

	CeL.toggle_display('download_job_panel', true);

	crawler.start(work_id, function(work_data) {
		destruct_download_job(crawler);
	});
}

function pause_resume_job(this_node, this_job) {
	if (this_node.stopped) {
		this_node.stopped = false;
		continue_task(this_job);
		CeL.DOM.set_text(this_node,
		// pause
		_((old_Unicode_support ? '' : '⏸')
		// gettext_config:{"id":"stop"}
		+ _('暫停')));
	} else {
		this_node.stopped = true;
		stop_task(this_job);
		CeL.DOM.set_text(this_node, _('▶️'
		// resume ⏯ "恢復下載 (略稱)"
		// gettext_config:{"id":"continue"}
		+ _('繼續')));
	}
	return false;
}

// queue 佇列
Download_job.job_list = [];

function is_Download_job(value) {
	return value instanceof Download_job;
}

function add_new_download_job(crawler, work_id, no_message) {
	// gettext_config:{"id":"input-series-name-or-id-first"}
	var attention_message = '請先輸入作品名稱或🆔。';
	hide_attention_panel(attention_message);

	if (crawler.downloading_work_data) {
		work_id = work_id.trim();
		if (work_id && crawler.downloading_work_data.id !== work_id
				&& crawler.downloading_work_data.title !== work_id
				&& !crawler.download_queue.includes(work_id)) {
			crawler.download_queue.push(work_id);
			if (!no_message) {
				CeL.info([ {
					T : [
							// gettext_config:{"id":"downloading-«$2»-from-$1.-please-wait-until-the-download-is-complete-or-cancel-the-download-before-downloading-$3"}
							'正在從%1下載《%2》這個作品。將等到這個作品下載完畢，或者取消下載後，再下載 %3。',
							crawler.site_name,
							crawler.downloading_work_data.title
									|| crawler.downloading_work_data.id,
							work_id ]
				} ]);
			}
		}
		return;
	}

	// embryonic work_data
	crawler.downloading_work_data = {
		id : work_id,
		// 紀錄原先輸入名稱。
		original_downloading_name : work_id,
		job_index : Download_job.job_list.length
	};
	var job = new Download_job(crawler, work_id);
	// @see function initialize_work_data(crawler, work_data)
	Download_job.job_list.push(job);
	return job;
}

function toggle_download_job_panel() {
	if (Download_job.job_list.every(function(job) {
		return !job;
	})) {
		// 已經沒有任何工作正在處理中。
		set_taskbar_progress(NONE_TASKBAR_PROGRESS);
		CeL.toggle_display('download_job_panel', false);
	}
}

var latest_play_finished_sound = Date.now();

function destruct_download_job(crawler) {
	var work_data = crawler.downloading_work_data;
	if (!work_data) {
		// e.g., 作業已經取消。
		return;
	}

	var job_index = work_data.job_index, job = Download_job.job_list[job_index];
	// Release memory. 釋放被占用的記憶體。
	delete crawler.downloading_work_data;
	delete work_data.job_index;
	function remove_download_work_layer() {
		delete Download_job.job_list[job_index];
		CeL.DOM.remove_node(job.layer);
	}
	if (work_data.error_list
			|| default_configuration.preserve_download_work_layer) {
		// gettext_config:{"id":"stop"}
		// remove "暫停"
		// job.layer.removeChild(job.layer.firstChild);
		CeL.new_node([ {
			T : '↻',
			// gettext_config:{"id":"redownloading"}
			R : _('重新下載'),
			C : 'task_controller',
			onclick : function() {
				remove_download_work_layer();
				// crawler.recheck = true;
				add_new_download_job(crawler,
				// 重新下載鍵功能 以原先輸入名稱去下載
				work_data.original_downloading_name
				//
				|| work_data.title || work_data.id);
			},
			S : 'color: blue; font-weight: bold;'
		}, {
			T : old_Unicode_support ? '❌' : '🗙',
			// gettext_config:{"id":"clearing-downloaded-record"}
			R : '清除本下載紀錄',
			C : 'task_controller',
			onclick : function() {
				remove_download_work_layer();
				toggle_download_job_panel();
			},
			S : 'color: red;'
		} ], job.layer);
		// job.layer === job.progress_layer.parentNode.parentNode

		if (work_data.error_list) {
			work_data.error_list = work_data.error_list.unique();
			// 在進度條顯現出這個作品下載失敗
			job.progress_layer.parentNode.style.backgroundColor = '#f44';
			job.progress_layer.innerHTML += ' <span class="error">'
			// 顯示最後一個錯誤。
			+ work_data.error_list[work_data.error_list.length - 1] + '</span>'
			//
			+ (work_data.error_list.length > 1 ? ' <small>'
			//
			// gettext_config:{"id":"(there-are-$1-errors-in-total)"}
			+ _('（總共有%1個錯誤）', work_data.error_list.length) + '</small>' : '');
			job.layer.title = work_data.error_list.join(CeL.env.line_separator);
			if (false)
				CeL.new_node([ {
					br : null
				}, {
					ul : work_data.error_list
				} ], job.layer);
		}
	} else {
		remove_download_work_layer();
	}

	if (Array.isArray(crawler.download_queue)
			&& crawler.download_queue.length > 0) {
		// download next work_title
		add_new_download_job(crawler, crawler.download_queue.shift());
	} else
		toggle_download_job_panel();

	if (crawler.play_finished_sound
			&& (Date.now() - latest_play_finished_sound > 2000)) {
		// 播放任務完成的音效。
		document.getElementById("finished_sound").play();
		latest_play_finished_sound = Date.now();
	}
}

function initialize_work_data(crawler, work_data) {
	if (!crawler.downloading_work_data) {
		// e.g., from search_work_title();
		return;
	}

	if (crawler.downloading_work_data === work_data) {
		return work_data;
	}

	if ((!work_data
	// e.g., work_data is image_data
	|| !work_data.chapter_count) && ('title' in crawler.downloading_work_data)
			&& crawler.downloading_work_data.chapter_count > 0) {
		return crawler.downloading_work_data;
	}

	// 初始化 initialization: crawler.downloading_work_data, job.work_data

	// 可能輸入 work_id or work_title。
	if (typeof work_data === 'object') {
		// reset error list 下載出錯的作品
		delete work_data.error_list;

		// 這裡的 .id 可能是作品標題，因此不應該覆蓋 work_data.id
		delete crawler.downloading_work_data.id;
		// copy attributes
		crawler.downloading_work_data = Object.assign(work_data,
				crawler.downloading_work_data);

		var job = Download_job.job_list[work_data.job_index];
		// @see function add_new_download_job(crawler, work_id, no_message)
		job.work_data = work_data;

		return work_data;
	}
}

function after_download_chapter(work_data, chapter_NO) {
	initialize_work_data(this, work_data);

	work_data.downloaded_chapters = chapter_NO;
	var percent = Math.round(1000 * chapter_NO / work_data.chapter_count)
	// 將 "/ 10" 提到上一行會造成無法格式化程式碼的問題。
	/ 10 + '%', job = Download_job.job_list[work_data.job_index];

	// add link to work
	var title_tag = job.layer.childNodes[0];
	if (!title_tag.href) {
		var work_URL = job.crawler.full_URL(job.crawler.work_URL, work_data.id), a_node = {
			a : title_tag.childNodes,
			onclick : open_URL,
			C : title_tag.className
		};
		if (typeof work_URL === 'string') {
			// 對於一些需要 POST 取得 JSON 作品資料的作品，work_URL 可能是 {Array}。
			a_node.href = work_URL;
		}
		job.layer.replaceChild(CeL.new_node(a_node), title_tag);
	}

	job.progress_layer.style.width = percent;
	if (work_data.error_list) {
		job.progress_layer.style.backgroundColor = '#f88';
	}
	// CeL.DOM.set_text(job.progress_layer, percent);
	CeL.new_node([ percent + ' ', {
		span : chapter_NO + '/' + work_data.chapter_count,
		S : 'font-size: .8em; color: #852;'
	} ], [ job.progress_layer, 'clean' ]);

	var all_chapters = 0, all_downloaded_chapters = 0;
	Download_job.job_list.forEach(function(job) {
		if (!job)
			return;
		var work_data = job.crawler.downloading_work_data;
		if (typeof work_data === 'object' && work_data.chapter_count > 0) {
			all_chapters += work_data.chapter_count;
			all_downloaded_chapters += work_data.downloaded_chapters || 0;
		}
	});

	set_taskbar_progress(all_downloaded_chapters / all_chapters);
}

function onerror(error, work_data) {
	// e.g., work_data is image_data
	work_data = initialize_work_data(this, work_data) || this
			&& this.downloading_work_data;

	// work_data 可能為 undefined/image_data
	if (work_data) {
		if (!work_data.error_list) {
			work_data.error_list = [];
		}
		work_data.error_list.push(error);
		console.trace(error);
	} else {
		CeL.error(error);
	}

	// 會在 .finish_up() 執行。
	// destruct_download_job(this);
	return CeL.work_crawler.THROWED;
}

// ----------------------------------------------

function start_gui_crawler() {
	set_taskbar_progress(NONE_TASKBAR_PROGRESS);
	var crawler = get_crawler();
	if (!crawler) {
		return;
	}

	// initialization && initialization();

	// gettext_config:{"id":"input-series-name-or-id-first"}
	var attention_message = '請先輸入作品名稱或🆔。';

	// or work_title
	var work_id = CeL.node_value('#input_work_id');
	if (test_and_attention(attention_message, !work_id)) {
		CeL.get_element('input_work_id').focus();
	} else {
		hide_attention_panel(attention_message);
		add_new_download_job(crawler, work_id);
	}
}

function to_crawler(crawler) {
	return is_Download_job(crawler) ? crawler.crawler : crawler
			|| get_crawler();
}

function stop_task(crawler) {
	if (crawler = to_crawler(crawler))
		crawler.stop_task();
	return false;
}

function continue_task(crawler) {
	if (crawler = to_crawler(crawler))
		crawler.continue_task();
	return false;
}

function cancel_task(crawler) {
	set_taskbar_progress(NONE_TASKBAR_PROGRESS);
	if (crawler = to_crawler(crawler)) {
		crawler.stop_task(true, function() {
			// 會在 .finish_up() 執行。
			// destruct_download_job(crawler);
		});
	}
	return false;
}

// ----------------------------------------------

// https://github.com/electron/electron/blob/master/docs/api/shell.md
function open_download_directory(crawler) {
	if (is_Download_job(crawler)) {
		// console.log( crawler.work_data);
		if (crawler.work_data && crawler.work_data.directory)
			show_fso(crawler.work_data.directory);
	} else if (crawler = to_crawler(crawler))
		show_fso(crawler.main_directory);
	return false;
}

// ----------------------------------------------

function check_update_NOT_package() {
	// ，請勿關閉程式
	CeL.log({
		// gettext_config:{"id":"auto-updating-to-git-master-branch-version"}
		T : '自動更新非安裝包版本中……'
	});

	// 非安裝包圖形介面自動更新功能。
	// This method can not get update result.
	require('child_process').exec('node work_crawler.updater.js', {
		// pass I/O to the child process
		// https://nodejs.org/api/child_process.html#child_process_options_stdio
		stdio : 'inherit'
	}, function(error, stdout, stderr) {
		if (error) {
			CeL.error({
				// gettext_config:{"id":"updating-tool-failed-$1"}
				T : [ '非安裝包版本更新失敗：%1', error ]
			});
			show_attention({
				b : {
					// gettext_config:{"id":"updating-tool-failed-$1"}
					T : [ '非安裝包版本更新失敗：%1', error ]
				}
			});
		} else {
			CeL.log({
				// gettext_config:{"id":"git-master-branch-update-completed.-you-have-to-restart-the-application-to-use-the-new-version"}
				T : '非安裝包版本更新完畢。您需要重新啟動程式以使用新版本。'
			});

			CeL.new_node({
				// 重新啟動應用程式或重新整理網頁(Ctrl-R)
				span : [ {
					// gettext_config:{"id":"update-completed"}
					T : '更新完畢。'
				}, {
					// gettext_config:{"id":"restart-the-program"}
					T : '重新啟動應用程式。'
				}, {
					// gettext_config:{"id":"all-current-jobs-will-be-interrupted"}
					T : '所有當前作業都會中斷！',
					S : 'color: red; font-weight: bold;'
				} ],
				// gettext_config:{"id":"it-is-recommended-to-restart-the-application-to-use-the-fully-updated-program"}
				R : _('建議重新啟動應用程式以使用完整更新後的程式。'),
				S : 'cursor: pointer;',
				onclick : function() {
					// app.relaunch(); @ gui_electron.js
					node_electron.ipcRenderer.send('send_message', 'relaunch');

					// 重新讀取應用程式之網頁部分。
					// history.go(0);
				}
			}, [ update_panel, 'clean' ]);
		}
	});
}

function check_update() {
	if (!global.auto_update) {
		CeL.log({
			// gettext_config:{"id":"automatically-update-is-disabled"}
			T : '已設定不自動更新。'
		});
		return;
	}

	// 📦安裝包圖形介面自動更新功能交由 start_update() @ gui_electron.js，
	// 不在此處處理。
	if (is_installation_package) {
		return;
	}

	CeL.debug({
		// gettext_config:{"id":"checking-update"}
		T : '檢查更新中……'
	});
	var GitHub_repository_path = 'kanasimi/work_crawler';
	var update_panel = CeL.new_node({
		div : {
			// gettext_config:{"id":"checking-update"}
			T : '檢查更新中……',
			C : 'waiting'
		},
		id : 'update_panel',
		onclick : function() {
			CeL.toggle_display(update_panel, false);
		}
	}, [ document.body, 'first' ]);

	function update_process(version_data) {
		// console.log(version_data);
		if (!version_data.has_new_version) {
			// check completed
			CeL.log({
				// gettext_config:{"id":"great-you-re-updated"}
				T : '未發現新版本。'
			});
			CeL.toggle_display(update_panel, false);
			return;
		}

		// package_information
		var package_data = is_installation_package ? process.resourcesPath
				+ '\\app.asar\\' : CeL.work_crawler.prototype.main_directory;
		package_data = CeL.read_file(package_data + 'package.json');
		if (!package_data) {
			CeL.error({
				// gettext_config:{"id":"unable-to-read-version-information-from-package.json"}
				T : '無法讀取版本資訊 package.json！'
			});
			CeL.toggle_display(update_panel, false);
			return;
		}

		package_data = JSON.parse(package_data.toString());
		var has_version = version_data.has_version || package_data
				&& package_data.version;
		CeL.new_node([ {
			a : {
				// gettext_config:{"id":"update-available-$1"}
				T : [ '有新版本：%1', version_data.latest_version ]
			},
			href : 'https://github.com/' + GitHub_repository_path,
			onclick : open_URL
		}, has_version ? [ {
			br : null
		}, '← ' + has_version ] : '' ], [ update_panel, 'clean' ]);
		show_attention({
			a : {
				// gettext_config:{"id":"update-available-$1"}
				T : [ '有新版本：%1', version_data.latest_version ]
			},
			href : 'https://github.com/' + GitHub_repository_path,
			onclick : open_URL
		});

		check_update_NOT_package();
	}

	try {
		require('gh-updater')
		// 必須手動上網站把檔案下載下來執行更新。
		.check_version(GitHub_repository_path, update_process);

	} catch (e) {
		CeL.error({
			// gettext_config:{"id":"update-checking-failed-$1"}
			T : [ '更新檢測失敗：%1', e ]
		});
		// gettext_config:{"id":"update-failed"}
		CeL.node_value(update_panel, _('更新失敗！'));
		CeL.set_class(update_panel, 'check_failed', {
			reset : true
		});
		update_panel.title = e;
	}
}

// ----------------------------------------------

var NONE_TASKBAR_PROGRESS = -1,
// 不定量的進度，沒有細細的進度條。
INDETERMINATE_TASKBAR_PROGRESS = 2;

// GUI progress bar
function set_taskbar_progress(progress) {
	if (// CeL.platform.OS !== 'darwin' ||
	!process.env.Apple_PubSub_Socket_Render) {
		// macOS APP 中 win.setProgressBar() 會造成 crash?
		node_electron.ipcRenderer.send('set_progress', progress);
	}
}

// https://electronjs.org/docs/api/dialog
function open_dialog(options, callback) {
	var id;
	do {
		id = Math.random();
	} while (id in open_dialog.queue);
	if (callback)
		open_dialog.queue[id] = callback;
	node_electron.ipcRenderer.send('open_dialog', [ id, options ]);
}
open_dialog.queue = Object.create(null);

function recerive_dialog_result(event, result) {
	var id = result[0];
	result = result[1];
	var callback = open_dialog.queue[id];
	delete open_dialog.queue[id];
	if (!callback
	// || result && result.canceled
	) {
		return;
	}
	// 注意: 選擇目錄時，不會自動加上最後的目錄分隔符號！
	callback(result);
}

function open_DevTools() {
	node_electron.ipcRenderer.send('open_DevTools', true);
	console.warn('-'.repeat(80));
	// gettext_config:{"id":"this-column-is-basically-for-debugging-purposes-only.-if-you-have-downloading-problems-please-feel-free-to-report-the-issue-thank-you"}
	console.warn(_('本欄基本上僅供調試使用。若您有下載功能方面的需求，煩請提報議題，謝謝。') + ' '
			+ 'https://github.com/kanasimi/work_crawler/issues');
	return false;
}

// ----------------------------------------------

function test_and_attention(message, condition_to_show) {
	if (condition_to_show) {
		show_attention({
			b : {
				T : message
			}
		}, message);
		return condition_to_show;
	}
	hide_attention_panel(message);
}

var attention_data = Object.create(null);

function show_attention(message, options) {
	if (options && options.type)
		attention_data.type = options.type;
	CeL.new_node(message, [ 'attention_inner', 'clean' ]);
	CeL.toggle_display('attention_panel', true);
}

function hide_attention_panel(options) {
	if (options && options.type) {
		// only remove this type
		if (attention_data.type !== options.type)
			return;
	}
	CeL.toggle_display('attention_panel', false);
}
