/**
 * 新增或更新網站的時候，除了.js 工具檔功能寫完之外，還必須要更改 README.md、本檔案中的 download_sites_set 以及
 * GitHub 上的簡介。
 */

// const
var node_electron = require('electron'),
// const: work_crawler/
base_directory = '../',
// const
site_type_description = {
	'comic.cmn-Hans-CN' : '中国内地漫画',
	'comic.ja-JP' : '日本語のウェブコミック',
	'comic.en-US' : 'English webcomics',
	'novel.cmn-Hans-CN' : '中国内地小说',
	'novel.ja-JP' : '日本語のオンライン小説'
},
// const
download_sites_set = {
	'comic.cmn-Hans-CN' : {
		qq : '腾讯漫画',
		'163' : '网易漫画',
		u17 : '有妖气',
		zymk : '知音漫客',
		dajiaochong : '大角虫漫画',
		kuaikan : '快看漫画',
		weibo : '微博动漫',
		bilibili : '哔哩哔哩漫画',
		sfacg : 'SF漫画',

		katui : '卡推漫画',
		pufei : '扑飞漫画',
		taduo : '塔多漫画',
		'733dm' : '733动漫网',
		'733mh' : '733漫画网',
		mh160 : '漫画160',
		nokiacn : '乙女漫画',
		iqg365 : '365漫画网',
		'360taofu' : '360漫画',
		dagu : '大古漫画网',
		manhuadb : '漫画DB',

		// '2manhua' : '爱漫画',
		'57mh' : '57漫画网',

		dmzj : '动漫之家',
		dm5 : '动漫屋',
		tohomh : '土豪漫画',

		manhuatai : '漫画台',

		manhuagui : '看漫画/漫画柜',
		manhuagui_tw : '繁體版漫畫櫃',
		gufengmh : '古风漫画网',
		'36mh' : '36漫画网',
		'930mh' : '亲亲漫画网',

		hhcool : '汗汗酷漫',
		omanhua : '哦漫画',

		migudm : '咪咕圈圈',

		comico : 'comico',

		webtoon : 'WEBTOON',
		dongman : '咚漫'

	// mrblue : 'Mr.Blue (不再維護)'
	},
	'comic.ja-JP' : {
		ComicWalker : 'ComicWalker',
		youngaceup : 'ヤングエースUP',

		AlphaPolis_manga : 'アルファポリス',

		moae : 'モアイ',

		pixivcomic : 'pixivコミック',
		OVERLAP : 'OVERLAP',
		MAGCOMI : 'MAGCOMI',
		cycomi : 'サイコミ',

		XOY : 'WEBTOON ja',

		comico_jp : 'コミコ',
		comico_jp_plus : 'オトナ限定 コミコ'
	},
	'comic.en-US' : {
		webtoon : 'WEBTOON en',

		mangamew : 'Manga Mew (不再維護)',
		manganew : 'Manga New (不再維護)',

		Rocaca : 'rocaca (不再維護)'
	},
	'novel.cmn-Hans-CN' : {
		ck101 : '卡提諾論壇 小說頻道',

		qidian : '起点中文网',

		// PTCMS
		// '23us' : '顶点小说',
		'81xsw' : '八一中文网',
		'88dus' : '八八读书网',
		'630book' : '恋上你看书网',

		// 杰奇小说连载系统
		kanshushenzhan : '看书神站',
		huaxiangju : '花香居',
		zhuishubang : '追书帮',

		daocaoren : '稻草人书屋',
		luoxia : '落霞小说网',
		kanunu : '努努书坊',
		piaotian : '飘天文学'
	},
	'novel.ja-JP' : {
		AlphaPolis : 'アルファポリス',
		Hameln : 'ハーメルン',
		kakuyomu : 'カクヨム',
		noc : 'ノクターンノベルズ',
		yomou : '小説を読もう！'
	}
},
// const 下載選項。有順序。常用的排前面。
// @see CeL.application.net.work_crawler
download_options_set = {
	// 亮著的原因可能是因為設定成了 'changed'，此時請取消勾選後重新勾選可強制從頭檢測。
	recheck : '從頭檢測所有作品之所有章節與所有圖片。',
	start_chapter : '將開始/接續下載的章節編號。對已下載過的章節，必須配合 .recheck。',
	chapter_filter : '篩選想要下載的章節標題關鍵字。例如"單行本"。',
	// 重新擷取用的相關操作設定。
	// 漫畫不需要重建電子書檔案
	regenerate : '章節數量無變化時依舊利用 cache 重建資料(如下載小說時不重新取得網頁資料，只重建ebook檔)。',
	reget_chapter : '重新取得每個所檢測的章節內容。',

	archive_images : '漫畫下載完畢後壓縮圖像檔案。',

	// 容許錯誤用的相關操作設定。
	MAX_ERROR_RETRY : '出錯時重新嘗試的次數。',
	allow_EOI_error : '當圖像不存在 EOI (end of image) 標記，或是被偵測出非圖像時，依舊強制儲存檔案。',
	MIN_LENGTH : '最小容許圖案檔案大小 (bytes)。若值太小，傳輸到一半壞掉的圖片可能被當作正常圖片而不會出現錯誤。',
	skip_error : '忽略/跳過圖像錯誤。',
	skip_chapter_data_error : '當無法取得 chapter 資料時，直接嘗試下一章節。',

	one_by_one : '循序逐個、一個個下載圖像。僅對漫畫有用，對小說無用。小說章節皆為逐個下載。',
	main_directory : '下載檔案儲存目錄路徑。圖片檔+紀錄檔下載位置。',
	user_agent : '瀏覽器識別。運行前後始終維持相同的瀏覽器識別，應該就不會影響到下載。',

	write_chapter_metadata : '將每個章節壓縮檔的資訊寫入同名(添加.json延伸檔名)的JSON檔，方便其他工具匯入用。',
	write_image_metadata : '將每個圖像的資訊寫入同名(添加.json延伸檔名)的JSON檔，方便其他工具匯入用。',

	preserve_download_work_layer : '下載完成後保留下載進度條'
},
// const `global.data_directory`/`default_configuration_file_name`
default_configuration_file_name = 'work_crawler.configuration.json',
//
theme_list = 'light|dark'.split('|');

var save_config_this_time = true;

var site_used, default_configuration, download_site_nodes = [], download_options_nodes = {},
// 為 electron-builder 📦安裝包
is_installation_package,
// 會儲存到 crawler.preference.crawler_configuration 的選項。
save_to_preference = Object.assign({}, download_options_set), preserve_download_work_layer,
// Windows 10: Windows NT 10.0; Win64; x64
old_Unicode_support = navigator.appVersion.match(/Windows NT (\d+(?:\.\d))/);
if (old_Unicode_support) {
	// 舊版本的 Windows 7 不支援"⬚ "之類符號。
	old_Unicode_support = +old_Unicode_support[1] < 10;
}

// save_to_preference 不可包含 main_directory，因為已來不及，且會二次改變 main_directory。
delete save_to_preference.main_directory;

require(base_directory + 'work_crawler_loder.js');

CeL.run([ 'application.debug.log', 'interact.DOM' ], initializer);

// ---------------------------------------------------------------------//

function check_max_logs() {
	var panel = CeL.get_element('max_logs'), show = CeL.toggle_display(panel) !== 'none';
	CeL.Log.set_max_logs(show ? panel.value : undefined);
	CeL.set_class(this, 'disabled', {
		remove : show
	});
	this.innerHTML = _(CeL.DOM_data(this).gettext = show ? '限制訊息行數' : '不限制訊息行數');
	CeL.node_value(this.parentNode.firstChild, show ? '✂️' : '');
}

// for i18n: define gettext() user domain resource location.
// gettext() will auto load (CeL.env.domain_location + language + '.js').
// e.g., resource/cmn-Hant-TW.js, resource/ja-JP.js
CeL.env.domain_location = function() {
	is_installation_package = CeL.is_installation_package();

	return CeL.env.domain_location
	// CeL.env.script_base_path: 形如 ...'/work_crawler/gui_electron/'
	= CeL.env.script_base_path.replace(/gui_electron[\\\/]$/, '')
	// resource/
	+ CeL.env.resource_directory_name + '/';
	// 在安裝包中， `process.cwd()` 可能為
	// C:\Users\user\AppData\Local\Programs\work_crawler
// 因此 CeL.env.domain_location 必須提供完整路徑。
};

// declaration for gettext()
var _;
// language force convert
var force_convert = 'en';

// initialization
function initializer() {

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

	CeL.debug('當前目錄: ' + CeL.storage.working_directory(), 1);
	CeL.debug('環境變數: ' + JSON.stringify(process.env), 1);

	// --------------------------------

	_ = CeL.gettext;

	_.create_menu('language_menu', [ 'TW', 'CN', 'ja', 'en', 'ko' ],
	// 預設介面語言繁體中文+...
	function() {
	});

	// translate all nodes to show in specified language (or default domain).
	_.translate_nodes();

	// --------------------------------

	_.load_domain(force_convert);
	if (!global.data_directory) {
		global.data_directory = CeL.determin_download_directory();
	}
	CeL.info({
		T : [ 'Default download location: %1', global.data_directory ]
	});
	CeL.info({
		// 🚧 https://weblate.org/zh-hant/
		span : [ {
			T : '歡迎與我們一同翻譯介面文字！#1',
			force_convert : force_convert
		}, {
			a : {
				T : '歡迎與我們一同翻譯介面文字！#2',
				force_convert : force_convert
			},
			href : 'https://github.com/kanasimi/work_crawler/issues/185',
			onclick : open_external
		}, {
			T : '歡迎與我們一同翻譯介面文字！#3',
			force_convert : force_convert
		} ]
	});
	// read default configuration
	default_configuration = CeL.get_JSON(global.data_directory
			+ default_configuration_file_name)
			|| CeL.null_Object();

	// --------------------------------

	select_theme(default_configuration.CSS_theme);

	var theme_nodes = [ {
		T : '布景主題：'
	} ];
	theme_list.forEach(function(theme_name) {
		theme_nodes.push({
			T : theme_name,
			C : theme_name,
			onclick : select_theme
		});
	});
	CeL.new_node(theme_nodes, 'select_theme_panel');
	// free
	theme_nodes = null;

	// --------------------------------

	// 初始化 initialization: download_site_nodes
	Object.assign(download_site_nodes, {
		link_of_site : CeL.null_Object(),
		node_of_id : CeL.null_Object()
	});

	var site_nodes = [];
	for ( var site_type in download_sites_set) {
		var label_node = CeL.new_node({
			div : {
				T : site_type_description[site_type] || site_type
			},
			title : site_type,
			C : 'site_type_label'
		}), label_sites = [];

		var sites = download_sites_set[site_type];
		for ( var site_id in sites) {
			var site_node = CeL.new_node({
				span : sites[site_id],
				C : 'download_sites'
						+ (old_Unicode_support ? ' old_Unicode_support' : ''),
				title : site_type + '/' + site_id,
				onclick : function() {
					site_used = this.title;
					language_used = site_used.replace(/\/.+/, '');
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
			language_used = this.title;
		});
	}
	CeL.new_node(site_nodes, 'download_sites_list');

	set_click_trigger('download_sites_trigger', 'download_sites_list');

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

	var options_nodes = [];
	for ( var download_option in download_options_set) {
		var arg_type_data = CeL.work_crawler.prototype
		//
		.import_arg_hash[download_option],
		//
		arg_types = arg_type_data && Object.keys(arg_type_data).join(),
		//
		className = 'download_options', input_box = '';

		if (arg_types === 'number' || arg_types === 'string') {
			className += ' non_select';
			input_box = {
				input : null,
				id : download_option + '_input',
				C : 'type_' + arg_types,
				type : arg_types,
				onchange : function() {
					var crawler = get_crawler();
					if (!crawler) {
						return;
					}
					var key = this.parentNode.title;
					if (this.type === 'number') {
						if (this.value)
							crawler[key] = +this.value;
					} else {
						crawler[key] = this.value;
					}

					if (key in save_to_preference) {
						crawler.preference
						//
						.crawler_configuration[key] = crawler[key];
						save_preference(crawler);

					} else if (key === 'main_directory') {
						if (!default_configuration[crawler.site_id]) {
							default_configuration[crawler.site_id] = CeL
									.null_Object();
						}
						default_configuration
						//
						[crawler.site_id][key] = crawler[key];
						save_default_configuration();
					}
				}
			};
		}

		var option_object = {
			label : [ {
				b : download_option
			}, ':', input_box, download_options_set[download_option],
			//
			arg_type_data ? ' ('
			//
			+ Object.keys(arg_type_data).map(function(type) {
				var condition = arg_type_data[type];
				if (Array.isArray(condition)) {
					condition = condition.join('; ');
				} else {
					condition = JSON.stringify(condition);
				}
				return type + (condition ? ': ' + condition : '');
			}).join(' | ') + ')' : '' ],
			C : className,
			title : download_option
		};
		if (!input_box) {
			option_object.onclick = function() {
				var crawler = get_crawler();
				if (!crawler) {
					return;
				}
				var key = this.title;
				crawler[key] = !crawler[key];
				CeL.set_class(this, 'selected', {
					remove : !crawler[key]
				});

				if (key in save_to_preference) {
					crawler.preference
					//
					.crawler_configuration[key] = crawler[key];
					save_preference(crawler);
				}
			};
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
			b : [ '📥', {
				// 本次執行期間不儲存選項設定
				T : '自動儲存選項設定與最愛作品清單#1',
				force_convert : force_convert
			}, external_favorite_list ? {
				T : '自動儲存選項設定與最愛作品清單#2',
				force_convert : force_convert,
				S : 'color: orange;'
			} : '' ],
			onclick : function() {
				save_config_this_time = !save_config_this_time;
				CeL.info({
					T : save_config_this_time ? '已設定自動儲存選項設定。'
					//
					: '已設定不自動儲存選項設定。'
				});
				CeL.set_class(this, 'not_set', {
					remove : save_config_this_time
				});
			},
			C : 'button' + (save_config_this_time ? '' : ' ' + 'not_set')
		}, {
			b : [ '🔙', {
				T : '重設下載選項與最愛作品清單#1'
			}, external_favorite_list ? {
				T : '重設下載選項與最愛作品清單#2',
				S : 'color: orange;'
			} : '' ],
			onclick : function() {
				var crawler = get_crawler();
				if (!crawler) {
					return;
				}
				Object.assign(crawler, crawler.default_save_to_preference);
				crawler.preference.crawler_configuration = CeL.null_Object();
				// Skip .main_directory

				save_preference(crawler);
				reset_site_options();
				CeL.info('已重設下載選項。');
			},
			C : 'button'
		} ]
	}, 'download_options_panel'));

	// --------------------------------

	set_click_trigger('favorites_trigger', 'favorite_list');

	set_click_trigger('search_results_trigger', 'search_results');

	set_click_trigger('download_job_trigger', 'download_job_queue');

	// --------------------------------

	CeL.get_element('input_work_id').onkeypress = function(this_event) {
		if (this_event.keyCode === 13) {
			start_gui_crawler();
		}
	};

	if (CeL.platform.is_Windows()) {
		CeL.new_node([ {
			a : {
				T : '複製貼上快速鍵'
			},
			href : 'https://en.wikipedia.org/wiki/'
			//
			+ 'Cut,_copy,_and_paste#Common_keyboard_shortcuts',
			onclick : open_external
		}, ' - ', {
			T : '複製選取的項目：'
		}, {
			kbd : 'Ctrl+C'
		}, ' ', {
			span : ' | ',
			S : "color: blue;"
		}, {
			T : '貼上項目：'
		}, {
			kbd : 'Ctrl+V'
		} ], 'small_tips');
	}

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

	process.title = _('CeJS 線上小說漫畫下載工具');

	// --------------------------------

	node_electron.ipcRenderer.send('send_message', 'did-finish-load');
	node_electron.ipcRenderer.send('send_message', 'check-for-updates');

	CeL.get_element('input_work_id').focus();

	// 延遲檢測更新，避免 hang 住。
	setTimeout(check_update, 80);
	// CeL.set_debug();
}

// --------------------------------------------------------------------------------------------------------------------

function set_click_trigger(trigger, panel, callback) {
	CeL.set_class(trigger, 'trigger');
	CeL.add_listener('click', function() {
		CeL.toggle_display(panel);
		if (typeof callback === 'function') {
			callback.call(trigger, panel);
		}
		return false;
	}, trigger);
}

// ----------------------------------------------

function open_external(URL) {
	node_electron.shell.openExternal(typeof URL === 'string' ? URL : this.href);
	return false;
}

function save_default_configuration() {
	if (!save_config_this_time)
		return;
	// prepare work directory.
	CeL.create_directory(global.data_directory);
	CeL.write_file(global.data_directory + default_configuration_file_name,
			default_configuration);
}

// 保存下載偏好選項 + 最愛作品清單
// @private
function save_preference(crawler) {
	if (!save_config_this_time)
		return;
	// prepare work directory.
	CeL.create_directory(crawler.main_directory);
	CeL.write_file(crawler.main_directory + 'preference.json',
			crawler.preference);
}

function edit_favorites(crawler) {
	var favorites = get_favorites(crawler, true),
	//
	favorites_node = CeL.new_node({
		textarea : '',
		S : 'width: 99%; height: 20em;'
	});
	favorites_node.value = favorites_toString(favorites);

	CeL.new_node([ {
		div : {
			T : '請在每一行鍵入一個作品名稱或 id：'
		}
	}, favorites_node, {
		br : null
	}, {
		div : [ {
			// save
			b : [ '💾', {
				T : '儲存最愛作品清單'
			} ],
			onclick : function() {
				save_favorites(crawler, favorites_node.value);
				reset_favorites(crawler);
			},
			C : 'favorites_button'
		}, {
			// abandon
			b : [ old_Unicode_support ? '❌' : '🛑', {
				T : '放棄編輯最愛作品清單'
			} ],
			onclick : function() {
				reset_favorites(crawler);
			},
			C : 'favorites_button cancel'
		} ]
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
			get_parsed : get_parsed || remove_list,
			remove : remove_list
		});
		return get_parsed ? work_list.parsed : work_list;
	}

	work_list = crawler.preference.favorites;
	if (Array.isArray(work_list) && work_list.length > 0) {
		CeL.info('儲存最愛作品清單的檔案不存在或者沒有內容。採用舊有的最愛作品列表。');
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

	CeL.create_directory(favorite_list_file_path.replace(/[^\\\/]+$/g, ''));
	// backup old favorite list file 備份最後一次修改前的書籤，預防一不小心操作錯誤時還可以補救。
	CeL.move_file(favorite_list_file_path, favorite_list_file_path + '.'
			+ crawler.backup_file_extension);
	CeL.write_file(favorite_list_file_path, work_list_text);
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
						R : (old_Unicode_support ? '' : '🗁 ') + _('開啓作品下載目錄'),
						onclick : function() {
							open_external(work_directory);
						},
						S : 'cursor: pointer;'
					});

					var work_data = CeL.get_JSON(work_directory
					//
					+ CeL.env.path_separator + work_directory_name + '.json');
					// console.log(work_data);
					if (crawler.is_finished(work_data)) {
						nodes.push({
							span : '👌',
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
						// add finished 並且檢測上次下載與上次作品更新
						if ((!Date.parse(work_data.last_download.date)
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
			T : [ '%1 已完結的作品名稱或 id：%2', crawler.site_name || crawler.site_id,
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
				T : '檢查所有最愛作品之更新，並下載更新作品。'
			} ],
			onclick : function() {
				favorites.forEach(function(work_title) {
					add_new_download_job(crawler, work_title, true);
				});
			},
			C : 'favorites_button'
		} : {
			T : '🈳 尚未設定最愛作品。'
		}, {
			// 我的最愛
			b : [ '✍️', {
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
			T : [ '列表檔案中有%1個重複作品名稱或 id。', favorites.duplicated ]
		}, {
			// 我的最愛
			b : [ '🔨', {
				// 重新整理列表檔案
				T : '注解掉重複的作品名稱或 id',
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
				T : '刪除重複的作品名稱或 id'
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
				T : [ '注解掉%1個已完結的作品名稱或 id', finished_work_title_list.length ]
			} ],
			onclick : function() {
				remove_favorite(crawler, finished_work_title_list);
				reset_favorites(crawler);
			},
			C : 'favorites_button'
		} : '' ]
	}, favorites.length < read_work_data_limit
	//
	|| crawler.read_work_data ? '' : [ {
		b : [ '⌛️', {
			T : '讀取本網站作品資訊檔案以判別作品是否已下載過、是否完結。'
		}, {
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
		CeL.set_class(download_options_node, 'selected', {
			remove : arg_types === 'number' || arg_types === 'string'
					|| !crawler[download_option]
		});
		if (arg_types === 'number' || arg_types === 'string') {
			CeL.DOM.set_text(download_option + '_input',
			//
			crawler[download_option] || crawler[download_option] === 0
			//
			? crawler[download_option] : '');
		}
	}
}

// will called by setup_crawler() @ work_crawler_loder.js
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
	# work_crawler_loder.js
	# work_crawler_loder.configuration.js → site_configuration
	# global.data_directory + default_configuration_file_name → default_configuration
	# site script .js → crawler.*
	# setup_crawler.prepare() call setup_crawler.prepare() call default_configuration[site_id] → crawler.*
	# crawler.main_directory + 'preference.json' → crawler.preference
	 </code>
	 * 
	 * TODO: 將 default_configuration_file_name 轉入 work_crawler_loder.js
	 */

	// 在這邊引入最重要的設定是儲存的目錄 crawler.main_directory。
	// 在引入 crawler.main_directory 後，可以讓網站腳本檔案採用新的設定，把檔案儲存在最終的儲存目錄下。
	// 有些 crawler script 會 cache 網站整體的設定，如 .js 檔案，以備不時之需。因為是 cache，就算刪掉了也沒關係。
	// 只是下次下載的時候還會再重新擷取並且儲存一次。
	if (default_configuration[site_id]) {
		// e.g., crawler.main_directory
		CeL.info('import configuration of ' + site_id + ': '
				+ JSON.stringify(default_configuration[site_id]));
		Object.assign(crawler, default_configuration[site_id]);
	}

	crawler.preference = Object.assign({
		// 因為會'重設下載選項'，一般使用不應 cache 這個值。
		crawler_configuration : CeL.null_Object(),
		// 我的最愛 my favorite 書庫 library
		favorites : []
	}, CeL.get_JSON(crawler.main_directory + 'preference.json'));

	// import crawler.preference.crawler_configuration
	var crawler_configuration = crawler.preference.crawler_configuration;
	crawler.default_save_to_preference = CeL.null_Object();
	Object.keys(save_to_preference).forEach(function(key) {
		// Skip .main_directory
		crawler.default_save_to_preference[key] = crawler[key];
		if (key in crawler_configuration) {
			CeL.info('import preference of ' + site_id + ': '
			//
			+ key + '=' + crawler_configuration[key] + '←' + crawler[key]);
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
		a : [ '🔗 ', {
			// 作品平臺連結 (略稱)
			T : '連結'
		} ],
		href : crawler.base_URL,
		onclick : open_external
	} ], download_site_nodes.node_of_id[site_id].parentNode);
}

setup_crawler.prepare = prepare_crawler;

// ----------------------------------------------
// 搜尋功能。

var search_result_columns = {
	No : null,

	網站 : function(crawler, work_data, work_title) {
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

	標題 : [ '僅於所獲得之作品標題特殊，不同於所查詢之作品標題時，才會標示。',
	//
	function(crawler, work_data, work_title) {
		return work_data.title && work_data.title.trim() === work_title.trim()
		//
		? '' : work_data.title;
	} ],

	作者 : function(crawler, work_data) {
		return {
			small : work_data.author
		};
	},

	最愛 : [ '😘: 在最愛清單中, ➕: 加入最愛清單', function(crawler, work_data) {
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

	話數 : [ '章節數量', function(crawler, work_data) {
		this.S = 'text-align: right;';
		return work_data.chapter_count;
	} ],

	曾下載 : [ '當之前下載過時，標示上次下載到第幾章節。', function(crawler, work_data) {
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
			R : (old_Unicode_support ? '' : '🗁 ') + _('開啓作品下載目錄'),
			onclick : function() {
				// var work_data =
				// work_data_search_queue[this.parentNode.title];

				open_external(work_data.directory);
			},
			S : 'cursor: pointer;'
		} ] : '';
	} ],

	限 : [ '部份章節需要付費/被鎖住/被限制', function(crawler, work_data) {
		return work_data.some_limited ? '🔒' : '';
	} ],

	完 : [ '作品已完結。', function(crawler, work_data) {
		return crawler.is_finished(work_data) ? '👌' : '';
	} ],

	狀況 : [ '作品狀況', function(crawler, work_data) {
		var status = work_data.status, href = crawler.work_URL(work_data.id);
		if (Array.isArray(status)) {
			// tags
			status = status.join();
		} else if (status) {
			status = status.replace(/[\s,;.，；。]+$/, '');
		}
		return {
			a : status || '❓',
			R : work_data.id,
			href : crawler.full_URL(href),
			onclick : open_external
		};
	} ],

	最新 : [ '最新章節', function(crawler, work_data) {
		var node = work_data.latest_chapter && work_data.latest_chapter
		// 不需包含作品標題
		.replace(work_data.title, '');
		if (node && work_data.fill_from_chapter_list)
			node = [ {
				span : old_Unicode_support ? '' : '🧩',
				R : '資訊來自章節清單'
			}, node ];
		else
			node = node || work_data.last_update;

		node = work_data.latest_chapter_url ? [ {
			a : node,
			href : crawler.full_URL(work_data.latest_chapter_url),
			onclick : open_external
		}, node === work_data.last_update ? '' : {
			sub : work_data.last_update,
		} ] : {
			span : node
		};

		return node;
	} ],

};

function show_search_result(work_data_search_queue) {
	var work_title = work_data_search_queue.work_title, not_found_site_hash = CeL
			.null_Object(), OK = 0, node_list = [], result_columns = [];
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
			T : '點擊網站名稱可下載此網站之本作品。'
		}, {
			br : null
		} ];
	} else {
		node_list = [ {
			T : '所有網站都未能找到本作品。'
		} ];
	}

	node_list.unshift({
		T : [ '搜尋作品[%1]之結果：',
		// '<b>' + work_title + '</b>'
		work_title ]
	});

	// ------------------------------------------

	if (OK > 0) {
		node_list.push({
			// save
			b : [ '📥', {
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
				T : [ '將所有%1個網站找到的作品皆加入最愛清單', OK ]
			} ],
			onclick : function() {
				for ( var site_id in work_data_search_queue) {
					append_to_favorites(site_id, work_title);
				}
			},
			C : 'button'
		}, {
			b : [ '📥😘', {
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
		status_hash = CeL.null_Object();
		node_list.push({
			hr : null
		}, {
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
				th : '錯誤原因'
			}, {
				th : '作品網站',
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

		// free
		status_hash = not_found_list = null;
	}

	CeL.remove_all_child('search_results');
	CeL.new_node(node_list, 'search_results');
	// free
	node_list = null;
	delete CeL.get_element('search_results').running;
}

var language_used;
// 自動搜尋不同的網站並選擇下載作品。
function search_work_title() {
	if (!language_used) {
		CeL.info({
			// 點選 語言
			T : '請先指定要搜尋的作品類別或網站。'
		});
		return;
	}

	var work_title = CeL.node_value('#input_work_id').trim();
	if (!work_title) {
		CeL.info({
			T : '請輸入作品名稱或 id。'
		});
		CeL.get_element('input_work_id').focus();
		return;
	}

	var sites = CeL.get_element('search_results');
	if (sites.running) {
		CeL.error({
			T : [ '正在搜尋[%1]中，必須先取消當前的搜尋程序才能重新搜尋。', work_title ]
		});
		return;
	}
	sites.running = work_title;

	CeL.remove_all_child('search_results');
	CeL.new_node([ {
		T : [ '正在搜尋[%1]中……', work_title ]
	}, {
		span : '',
		id : 'searching_process'
	}, {
		div : '',
		id : 'still_searching'
	}, {
		b : '取消搜尋',
		onclick : function() {
			CeL.toggle_display('search_results_panel', false);
			work_data_search_queue = null;
			CeL.remove_all_child('search_results');
			delete CeL.get_element('search_results').running;
		},
		C : 'button'
	}, {
		b : '放棄還沒搜尋完成的網站',
		onclick : function() {
			work_data_search_queue.work_title = work_title;
			show_search_result(work_data_search_queue);
			work_data_search_queue = null;
		},
		C : 'button'
	} ], 'search_results');

	sites = download_sites_set[language_used];
	var work_data_search_queue = CeL.null_Object(), sites = Object.keys(sites), site_count = sites.length, done = 0, found = 0;
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
			if (work_data.chapter_count >= 0)
				found++;
			if (++done === site_count) {
				// all done
				work_data_search_queue.work_title = work_title;
				show_search_result(work_data_search_queue);
				return true;
			}
		}

		site_id = language_used + '/' + site_id;
		var crawler = get_crawler(site_id), chapter_time_interval = crawler
				.get_chapter_time_interval('search');
		CeL.debug(crawler.site_id + ' chapter_time_interval: '
				+ chapter_time_interval);
		if (chapter_time_interval > 60 * 1000) {
			all_done({
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
				T : [ '已完成 %1', found + ' / ' + done + ' / ' + site_count ]
			}, 'searching_process');

			if (site_count - done < 12) {
				var still_searching = sites.filter(function(site_id) {
					return !((language_used + '/' + site_id)
					//
					in work_data_search_queue);
				});

				CeL.remove_all_child('still_searching');
				CeL.new_node({
					T : [ '%1個網站仍在搜尋中：%2', still_searching.length,
							still_searching.join(', ') ]
				}, 'still_searching');
			}
		});
	});
	CeL.toggle_display('search_results_panel', true);
}

// ----------------------------------------------

function get_crawler(site_id, just_test) {
	site_id = site_id || site_used;
	if (!site_id) {
		if (!just_test) {
			CeL.info({
				T : '請先指定要下載的網站。'
			});
		}
		return;
	}

	var crawler = base_directory + site_id + '.js';
	CeL.debug('當前路徑: ' + CeL.storage.working_directory(), 1, 'get_crawler');
	CeL.debug('Load ' + crawler, 1, 'get_crawler');

	var old_site_used = site_used;
	// Will used in function prepare_crawler()
	site_used = site_id;

	// include site script .js
	// 這個過程會執行 setup_crawler() @ work_crawler_loder.js
	// 以及 setup_crawler.prepare()
	crawler = require(crawler);
	if (old_site_used !== site_used) {
		// recover
		site_used = old_site_used;
	} else {
		CeL.toggle_display('favorites_panel', true);
		CeL.toggle_display('download_options_panel', true);
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
			T : '下載任務初始化中……'
		},
		C : 'progress_layer'
	});
	var this_job = this;
	// console.log(crawler);
	this.layer = CeL.new_node({
		div : [ {
			b : [ crawler.site_name ? {
				span : crawler.site_name,
				R : crawler.site_id
			} : crawler.site_id, ' ', work_id ],
			C : 'task_label'
		}, {
			div : this.progress_layer,
			S : 'flex-grow: 1; background-color: #888;'
		}, {
			span : [ old_Unicode_support ? '' : '⏸', {
				// 暫停下載 (略稱)
				T : '暫停'
			} ],
			R : (old_Unicode_support ? '' : '⏯ ') + _('暫停/恢復下載'),
			C : 'task_controller',
			onclick : function() {
				if (this.stopped) {
					this.stopped = false;
					continue_task(this_job);
					CeL.DOM.set_text(this,
					// pause
					_((old_Unicode_support ? '' : '⏸') + _('暫停')));
				} else {
					this.stopped = true
					stop_task(this_job);
					CeL.DOM.set_text(this,
					// resume ⏯ "恢復下載 (略稱)"
					_('▶️' + _('繼續')));
				}
				return false;
			}
		}, {
			span : [ {
				b : '✘',
				S : 'color: red;'
			}, {
				// 取消下載 (略稱)
				T : '取消'
			} ],
			R : _('取消下載'),
			C : 'task_controller',
			onclick : cancel_task.bind(null, this_job)
		}, {
			span : '📂',
			R : (old_Unicode_support ? '' : '🗁 ') + _('開啓作品下載目錄'),
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

// queue 佇列
Download_job.job_list = [];

function is_Download_job(value) {
	return value instanceof Download_job;
}

function add_new_download_job(crawler, work_id, no_message) {
	if (crawler.downloading_work_data) {
		work_id = work_id.trim();
		if (work_id && crawler.downloading_work_data.id !== work_id
				&& crawler.downloading_work_data.title !== work_id
				&& !crawler.download_queue.includes(work_id)) {
			crawler.download_queue.push(work_id);
			if (!no_message) {
				CeL.info('正在從' + crawler.site_name + '下載 "'
				//
				+ (crawler.downloading_work_data.title
				//
				|| crawler.downloading_work_data.id)
				//
				+ '" 這個作品。將等到這個作品下載完畢，或者取消下載後，再下載 ' + work_id + '。');
			}
		}
		return;
	}

	var job = new Download_job(crawler, work_id);
	// embryonic
	crawler.downloading_work_data = {
		id : work_id,
		job_index : Download_job.job_list.length
	};
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

function destruct_download_job(crawler) {
	var work_data = crawler.downloading_work_data;
	if (!work_data) {
		// e.g., 作業已經取消。
		return;
	}

	var job_index = work_data.job_index, job = Download_job.job_list[job_index];
	// free
	delete crawler.downloading_work_data;
	delete work_data.job_index;
	function remove_download_work_layer() {
		delete Download_job.job_list[job_index];
		CeL.DOM.remove_node(job.layer);
	}
	if (work_data.error_list
			|| ('preserve_download_work_layer' in crawler ? crawler.preserve_download_work_layer
					: preserve_download_work_layer)) {
		// remove "暫停"
		// job.layer.removeChild(job.layer.firstChild);
		CeL.new_node([ {
			T : '↻',
			R : '重新下載',
			C : 'task_controller',
			onclick : function() {
				remove_download_work_layer();
				// crawler.recheck = true;
				add_new_download_job(crawler, work_data.title || work_data.id);
			},
			S : 'color: blue; font-weight: bold;'
		}, {
			T : old_Unicode_support ? '❌' : '🗙',
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
			+ (work_data.error_list.length > 1 ? ' <small>(總共有'
			//
			+ work_data.error_list.length + '個錯誤)</small>' : '');
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

	if (work_data) {
		// reset error list 下載出錯的作品
		delete work_data.error_list;

		// 這裡的 .id 可能是作品標題，因此不應該覆蓋 work_data.id
		delete crawler.downloading_work_data.id;
		crawler.downloading_work_data = Object.assign(work_data,
				crawler.downloading_work_data);

		var job = Download_job.job_list[work_data.job_index];
		job.work_data = work_data;

		return work_data;
	}
}

function after_download_chapter(work_data, chapter_NO) {
	initialize_work_data(this, work_data);

	work_data.downloaded_chapters = chapter_NO;
	var percent = Math.round(1000 * chapter_NO / work_data.chapter_count) / 10
			+ '%', job = Download_job.job_list[work_data.job_index];

	// add link to work
	var title_tag = job.layer.childNodes[0];
	if (!title_tag.href) {
		job.layer.replaceChild(CeL.new_node({
			a : title_tag.childNodes,
			href : job.crawler.full_URL(job.crawler.work_URL, work_data.id),
			onclick : open_external,
			C : title_tag.className
		}), title_tag);
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
	work_data = initialize_work_data(this, work_data);

	// work_data 可能為 undefined/image_data
	if (work_data) {
		if (!work_data.error_list) {
			work_data.error_list = [];
		}
		work_data.error_list.push(error);
	}

	console.trace(error);
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

	// or work_title
	var work_id = CeL.node_value('#input_work_id');
	if (work_id) {
		add_new_download_job(crawler, work_id);
	} else {
		CeL.info({
			T : '請輸入作品名稱或 id。'
		});
		CeL.get_element('input_work_id').focus();
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
			open_external(crawler.work_data.directory);
	} else if (crawler = to_crawler(crawler))
		open_external(crawler.main_directory);
	return false;
}

// ----------------------------------------------

function check_update_NOT_package() {
	// ，請勿關閉程式
	CeL.log({
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
				T : [ '非安裝包版本更新失敗：%1', error ]
			});
		} else {
			CeL.log({
				T : '非安裝包版本更新完畢。您需要重新啟動程式以使用新版本。'
			});
		}
	});
}

function check_update() {
	if (!global.auto_update) {
		CeL.log({
			T : '已設定不自動更新。'
		});
		return;
	}

	CeL.debug({
		T : '檢查更新中……'
	});
	var GitHub_repository_path = 'kanasimi/work_crawler';
	var update_panel = CeL.new_node({
		div : {
			T : '檢查更新中……',
			C : 'waiting',
			onclick : function() {
				CeL.toggle_display(update_panel, false);
			}
		},
		id : 'update_panel'
	}, [ document.body, 'first' ]);

	function update_process(version_data) {
		// console.log(version_data);
		if (!version_data.has_new_version) {
			// check completed
			CeL.log({
				T : '未發現新版本。'
			});
			CeL.toggle_display(update_panel, false);
			return;
		}

		var package_data = is_installation_package ? process.resourcesPath
				+ '\\app.asar\\' : CeL.work_crawler.prototype.main_directory;
		package_data = CeL.read_file(package_data + 'package.json');
		if (!package_data) {
			console.error('無法讀取版本資訊 package.json！');
			CeL.toggle_display(update_panel, false);
			return;
		}

		package_data = JSON.parse(package_data.toString());
		var has_version = version_data.has_version || package_data
				&& package_data.version;
		CeL.new_node([ {
			a : {
				T : [ '有新版本：%1', version_data.latest_version ]
			},
			href : 'https://github.com/' + GitHub_repository_path,
			onclick : open_external
		}, has_version ? [ {
			br : null
		}, '← ' + has_version ] : '' ], [ update_panel, 'clean' ]);

		// 📦安裝包圖形介面自動更新功能交由 start_update() @ gui_electron.js，
		// 不在此處處理。
		if (!is_installation_package) {
			check_update_NOT_package();
		}
	}

	try {
		require('gh-updater')
		// 必須手動上網站把檔案下載下來執行更新。
		.check_version(GitHub_repository_path, update_process);

	} catch (e) {
		CeL.error({
			T : [ '更新檢測失敗：%1', e ]
		});
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

function open_DevTools() {
	node_electron.ipcRenderer.send('open_DevTools', true);
	return false;
}

// ----------------------------------------------

// Select CSS theme
function select_theme(theme) {
	if (typeof theme !== 'string') {
		theme = this.innerHTML;
	}
	if (!theme_list.includes(theme)) {
		CeL.warn('select_theme: Invalid theme name: ' + theme);
		return;
	}

	theme_list.forEach(function(theme_name) {
		CeL.set_class(document.body, theme_name, {
			remove : theme_name !== theme
		});
	});

	default_configuration.CSS_theme = theme;
	save_default_configuration();
}
