/**
 * 新增或更新網站的時候，除了.js功能寫完之外，還必須要更改 README.md 以及本檔案中的 download_sites_set。
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
		// '2manhua' : '爱漫画',
		qq : '腾讯漫画',
		'163' : '网易漫画',
		u17 : '有妖气',
		zymk : '知音漫客',
		dajiaochong : '大角虫漫画',
		kuaikan : '快看漫画',

		katui : '卡推漫画',
		'733dm' : '733动漫网',
		'733mh' : '733漫画网',
		mh160 : '漫画160',
		nokiacn : '乙女漫画',
		dagu : '大古漫画网',
		manhuadb : '漫画DB',

		dmzj : '动漫之家',
		dm5 : '动漫屋',
		tohomh : '土豪漫画',

		manhuatai : '漫画台',

		manhuagui : '看漫画/漫画柜',
		manhuagui_tw : '繁體版漫畫櫃',
		gufengmh : '古风漫画网',
		'36mh' : '36漫画网',

		hhcool : '汗汗酷漫',
		omanhua : '哦漫画',

		comico : 'comico',

		webtoon : 'WEBTOON',
		dongman : '咚漫'
	},
	'comic.ja-JP' : {
		ComicWalker : 'ComicWalker',
		youngaceup : 'ヤングエースUP',

		AlphaPolis_manga : 'アルファポリス',

		moae : 'モアイ',

		pixivcomic : 'pixivコミック',
		OVERLAP : 'OVERLAP',
		MAGCOMI : 'MAGCOMI',

		XOY : 'WEBTOON ja',

		comico_jp : 'コミコ',
		comico_jp_plus : 'オトナ限定 コミコ'
	},
	'comic.en-US' : {
		webtoon : 'WEBTOON en',

		mangamew : 'Manga Mew',
		manganew : 'Manga New',

		Rocaca : 'rocaca'
	},
	'novel.cmn-Hans-CN' : {
		qidian : '起点中文网',
		'23us' : '顶点小说',
		'81xsw' : '八一中文网',
		'88dus' : '八八读书网',
		'630book' : '恋上你看书网',
		ck101 : '卡提諾論壇 小說頻道',
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
	recheck : '從頭檢測所有作品之所有章節與所有圖片。',
	start_chapter : '將開始/接續下載的章節編號。對已下載過的章節，必須配合 .recheck。',
	chapter_filter : '篩選想要下載的章節標題關鍵字。例如"單行本"。',
	// 重新擷取用的相關操作設定。
	regenerate : '章節數量無變化時依舊利用 cache 重建資料(如ebook)。',
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

	preserve_download_work_layer : '下載完成後保留下載進度條'
},
// const `global.data_directory`/`default_configuration_file_name`
default_configuration_file_name = 'work_crawler.configuration.json';

var site_used, default_configuration, download_site_nodes = [], download_options_nodes = {},
// 為 electron-builder 安裝包
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

// initialization
CeL.run([ 'application.debug.log', 'interact.DOM' ], function() {
	CeL.Log.set_board('log_panel');
	// CeL.set_debug();
	// 設置完成
	// CeL.debug('Log panel has been set.');
	CeL.Log.clear();

	CeL.debug('當前目錄: ' + CeL.storage.working_directory(), 1);
	CeL.debug('環境變數: ' + JSON.stringify(process.env), 1);

	// --------------------------------

	if (!global.data_directory) {
		global.data_directory = CeL.determin_download_directory();
	}
	CeL.info('預設的主要下載目錄: ' + global.data_directory);
	// read default configuration
	default_configuration = CeL.get_JSON(global.data_directory
			+ default_configuration_file_name)
			|| CeL.null_Object();

	// --------------------------------

	is_installation_package = CeL.is_installation_package();

	// 初始化 initialization: download_site_nodes
	Object.assign(download_site_nodes, {
		link_of_site : CeL.null_Object(),
		node_of_id : CeL.null_Object()
	});

	var site_nodes = [];
	for ( var site_type in download_sites_set) {
		var label_node = CeL.new_node({
			div : site_type_description[site_type] || site_type,
			C : 'site_type_label'
		}), label_sites = [];

		var sites = download_sites_set[site_type];
		for ( var site_id in sites) {
			var site_node = CeL.new_node({
				T : sites[site_id],
				C : 'download_sites'
						+ (old_Unicode_support ? ' old_Unicode_support' : ''),
				title : site_type + '/' + site_id,
				onclick : function() {
					site_used = this.title;
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
			S : 'display:none'
		});
		site_nodes.push(label_node, label_sites);
		set_click_trigger(label_node, label_sites);
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
		var arg_types = CeL.work_crawler.prototype
		//
		.import_arg_hash[download_option],
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
					arg_types ? ' (' + arg_types + ')' : '' ],
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

	set_click_trigger('download_options_trigger', CeL.new_node({
		div : [ options_nodes, {
			b : [ '重設下載選項', '' && {
				T : '與最愛作品清單',
				S : 'color: red;'
			} ],
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
			},
			C : 'button',
			S : 'margin: .5em; margin-left: 2em;'
		} ]
	}, 'download_options_panel'));

	// --------------------------------

	set_click_trigger('favorites_trigger', 'favorites_list');

	set_click_trigger('download_job_trigger', 'download_job_queue');

	// --------------------------------

	CeL.get_element('input_work_id').onkeypress = function(this_event) {
		if (this_event.keyCode === 13) {
			start_gui_crawler();
		}
	};

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

	check_update();

	'debug,log,info,warn,error'.split(',').forEach(function(log_type) {
		node_electron.ipcRenderer
		//
		.on('send_message_' + log_type, function(event, message) {
			CeL[log_type](message);
		});
	});

	process.title = 'CeJS 線上小說漫畫下載工具';

	// --------------------------------

	node_electron.ipcRenderer.send('send_message', 'did-finish-load');
	node_electron.ipcRenderer.send('send_message', 'check-for-updates');
});

// --------------------------------------------------------------------------------------------------------------------

function set_click_trigger(trigger, panel) {
	CeL.set_class(trigger, 'trigger');
	CeL.add_listener('click', function() {
		CeL.toggle_display(panel);
		return false;
	}, trigger);
}

// ----------------------------------------------

function open_external(URL) {
	node_electron.shell.openExternal(typeof URL === 'string' ? URL : this.href);
	return false;
}

function save_default_configuration() {
	// prepare work directory.
	CeL.create_directory(global.data_directory);
	CeL.write_file(global.data_directory + default_configuration_file_name,
			default_configuration);
}

// 保存下載偏好選項 + 最愛作品清單
// @private
function save_preference(crawler) {
	// prepare work directory.
	CeL.create_directory(crawler.main_directory);
	CeL.write_file(crawler.main_directory + 'preference.json',
			crawler.preference);
}

function edit_favorites(crawler) {
	var favorites = crawler.preference.favorites || [], favorites_node = CeL
			.new_node({
				textarea : '',
				S : 'width: 99%; height: 20em;'
			});
	favorites_node.value = favorites.join('\n');

	CeL.new_node([ {
		div : '請在每一行鍵入一個作品名稱或 id：'
	}, favorites_node, {
		br : null
	}, {
		div : [ {
			// save
			b : '💾儲存最愛作品清單',
			onclick : function() {
				crawler.preference.favorites
				// verify work titles
				= favorites_node.value.trim().split(/\n/)
				//
				.map(function(work_title) {
					return work_title.trim();
				}).filter(function(work_title) {
					return !!work_title;
				}).unique();

				save_preference(crawler);
				reset_favorites(crawler);
			},
			C : 'favorites_button'
		}, {
			// abandon
			b : (old_Unicode_support ? '❌' : '🛑') + '放棄編輯',
			onclick : function() {
				reset_favorites(crawler);
			},
			C : 'favorites_button cancel'
		} ]
	} ], [ 'favorites_list', 'clean' ]);
}

function reset_favorites(crawler) {
	if (!crawler)
		crawler = get_crawler();

	var favorites = crawler.preference.favorites || [];

	var favorites_nodes = favorites.map(function(work_title) {
		return {
			li : {
				a : work_title,
				href : '#',
				onclick : function() {
					add_new_download_job(crawler, work_title);
				}
			}
		};
	});

	favorites_nodes = [ favorites.length > 0 ? {
		ol : favorites_nodes
	} : '', {
		div : [ favorites.length > 0 ? {
			b : '檢查並下載所有最愛作品之更新',
			onclick : function() {
				favorites.forEach(function(work_title) {
					add_new_download_job(crawler, work_title, true);
				});
			},
			C : 'favorites_button'
		} : /* empty */'🈳 尚未設定最愛作品。', {
			// 我的最愛
			b : '✍️編輯最愛作品清單',
			onclick : function() {
				edit_favorites(crawler);
			},
			C : 'favorites_button'
		} ]
	} ];

	// console.log(favorites_nodes);
	CeL.new_node(favorites_nodes, [ 'favorites_list', 'clean' ]);
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
		arg_types = CeL.work_crawler.prototype.import_arg_hash[download_option];
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
		crawler.site_name = CeL.DOM_data(
				download_site_nodes.node_of_id[site_id], 'gettext');
	}
	download_site_nodes.link_of_site[site_id] = crawler.base_URL;
	// add link to site
	CeL.new_node([ ' ', {
		a : '🔗 link',
		href : crawler.base_URL,
		target : '_blank',
		onclick : open_external
	} ], download_site_nodes.node_of_id[site_id].parentNode);
}

setup_crawler.prepare = prepare_crawler;

function get_crawler(just_test) {
	if (!site_used) {
		if (!just_test) {
			CeL.info('請先指定要下載的網站。');
		}
		return;
	}

	CeL.toggle_display('favorites_panel', true);

	CeL.toggle_display('download_options_panel', true);

	var site_id = site_used, crawler = base_directory + site_id + '.js';
	CeL.debug('當前路徑: ' + CeL.storage.working_directory(), 1, 'get_crawler');
	CeL.debug('Load ' + crawler, 1, 'get_crawler');

	// include site script .js
	// 這個過程會執行 setup_crawler() @ work_crawler_loder.js
	// 以及 setup_crawler.prepare()
	crawler = require(crawler);

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
		div : '0%',
		C : 'progress_layer'
	});
	var this_job = this;
	this.layer = CeL.new_node({
		div : [ {
			b : [ {
				T : crawler.site_name,
				R : crawler.site_id
			}, ' ', work_id ],
			C : 'task_label'
		}, {
			div : this.progress_layer,
			S : 'flex-grow: 1; background-color: #888;'
		}, {
			T : (old_Unicode_support ? '' : '⏸') + '暫停',
			R : (old_Unicode_support ? '' : '⏯ ') + '暫停/恢復下載',
			C : 'task_controller',
			onclick : function() {
				if (this.stopped) {
					this.stopped = false;
					continue_task(this_job);
					CeL.DOM.set_text(this,
					// pause
					CeL.gettext((old_Unicode_support ? '' : '⏸') + '暫停'));
				} else {
					this.stopped = true
					stop_task(this_job);
					CeL.DOM.set_text(this,
					// resume ⏯
					CeL.gettext('▶️' + '繼續'));
				}
				return false;
			}
		}, {
			span : [ {
				b : '✘',
				S : 'color:red'
			}, {
				T : '取消'
			} ],
			R : '取消下載',
			C : 'task_controller',
			onclick : cancel_task.bind(null, this_job)
		}, {
			T : '📂',
			R : (old_Unicode_support ? '' : '🗁 ') + '開啓下載目錄',
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
			if (!no_message)
				CeL.info('正在從' + crawler.site_name + '下載 "'
						+ (crawler.downloading_work_data.title
						//
						|| crawler.downloading_work_data.id)
						+ '" 這個作品。將等到這個作品下載完畢，或者取消下載後，再下載 ' + work_id + '。');
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
		CeL.new_node([ {
			T : '↻',
			R : '重新下載',
			C : 'task_controller',
			onclick : function() {
				remove_download_work_layer();
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
			+ (work_data.error_list.length > 1 ? ' (總共有'
			//
			+ work_data.error_list.length + '個錯誤)' : '');
			job.layer.title = work_data.error_list.join('\n');
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
		add_new_download_job(crawler, crawler.download_queue.pop());
	} else
		toggle_download_job_panel();
}

function initialize_work_data(crawler, work_data) {
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
		CeL.info('請輸入作品名稱或 id。');
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

function check_update() {
	var update_panel;

	function update_process(version_data) {
		console.log(version_data);
		var package_data = JSON.parse(CeL.read_file(
				process.resourcesPath + '\\app.asar\\package.json').toString());

		if (version_data.has_new_version) {
			CeL.new_node({
				a : 'Update available: '
				//
				+ (version_data.has_version ? version_data.has_version
				//
				+ ' → ' : '') + version_data.latest_version,
				href : 'https://github.com/' + GitHub_repository_path,
				target : '_blank',
				onclick : open_external
			}, [ update_panel, 'clean' ]);
		} else {
			// check completed
			CeL.toggle_display(update_panel, false);
		}
	}

	try {
		if (!global.auto_update) {
			CeL.log('已設定不自動更新。');
			return;
		}

		if (!is_installation_package) {
			CeL.log('自動更新檢測並執行中。');
			// 非安裝包圖形介面自動更新功能
			var child_process = require('child_process');
			child_process.execSync('node work_crawler.updater.js', {
				// pass I/O to the child process
				// https://nodejs.org/api/child_process.html#child_process_options_stdio
				stdio : 'inherit'
			});
			return;
		}

		CeL.debug('Checking update...');
		var GitHub_repository_path = 'kanasimi/work_crawler';
		update_panel = CeL.new_node({
			div : {
				T : 'Checking update...',
				C : 'waiting'
			},
			id : 'update_panel'
		}, [ document.body, 'first' ]);

		var updater = require('gh-updater');
		updater.check_version(GitHub_repository_path,
		// 必須手動上網站把檔案下載下來執行更新。
		update_process);

	} catch (e) {
		CeL.error('Update checking failed: ' + e);
		CeL.node_value(update_panel, 'Update failed!');
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
