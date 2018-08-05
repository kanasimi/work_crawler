/**
 * 新增或更新網站的時候，除了.js功能寫完之外，還必須要更改 README.md 以及本檔案中的 download_sites_set。
 */

// work_crawler/
var base_directory = '../', site_used,
//
site_type_description = {
	'comic.cmn-Hans-CN' : '中国内地漫画',
	'comic.en-US' : 'English webcomics',
	'novel.cmn-Hans-CN' : '中国内地小说',
	'novel.ja-JP' : '日本のオンライン小説'
},
//
download_sites_set = {
	'comic.cmn-Hans-CN' : {
		// '2manhua' : '爱漫画',
		qq : '腾讯漫画',
		'163' : '网易漫画',
		u17 : '有妖气',
		dajiaochong : '大角虫漫画',
		kuaikan : '快看漫画',

		'733dm' : '733动漫网',
		'733mh' : '733漫画网',
		mh160 : '漫画160',

		dmzj : '动漫之家',
		dm5 : '动漫屋',

		manhuatai : '漫画台',

		manhuagui : '看漫画/漫画柜',
		gufengmh : '古风漫画网',
		'36mh' : '36漫画网',

		hhcool : '汗汗酷漫',
		omanhua : '哦漫画',

		webtoon : 'WEBTOON',
		dongman : '咚漫',
		XOY : 'WEBTOON ja',

		OVERLAP : 'OVERLAP',
		ComicWalker : 'ComicWalker'
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
// 下載選項。有順序。常用的排前面。
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
	skip_error : '忽略/跳過圖像錯誤。',
	skip_chapter_data_error : '當無法取得 chapter 資料時，直接嘗試下一章節。',

	one_by_one : '循序逐個、一個個下載圖像。僅對漫畫有用，對小說無用。小說章節皆為逐個下載。',
	main_directory : '下載檔案儲存目錄路徑。圖片檔+紀錄檔下載位置。',
	user_agent : '瀏覽器識別'
}, download_site_nodes = [], download_options_nodes = {};
download_site_nodes.link_of_site = {};
download_site_nodes.node_of_id = {};

require(base_directory + 'work_crawler_loder.js');

// initialization
CeL.run([ 'application.debug.log', 'interact.DOM' ], function() {
	CeL.Log.set_board('log_panel');
	// CeL.set_debug();
	// CeL.debug('Log panel setted.');
	CeL.Log.clear();

	CeL.work_crawler.prototype.user_agent = navigator.userAgent.replace(
			/(?:work_crawler|Electron)[\/.\d ]*/ig, '');

	var site_nodes = [];
	for ( var site_type in download_sites_set) {
		site_nodes.push({
			div : site_type_description[site_type] || site_type,
			C : 'site_type_label'
		});

		var sites = download_sites_set[site_type];
		for ( var site_id in sites) {
			var site_node = CeL.new_node({
				T : sites[site_id],
				C : 'download_sites',
				title : site_type + '/' + site_id,
				onclick : function() {
					site_used = this.title;
					reset_site_options();
				}
			});
			download_site_nodes.push(site_node);
			site_id = site_type + '/' + site_id;
			download_site_nodes.node_of_id[site_id] = site_node;
			site_nodes.push({
				div : site_node,
				C : 'click_item'
			});
		}
	}
	CeL.new_node(site_nodes, 'download_sites_list');

	CeL.add_listener('click', function() {
		CeL.toggle_display('download_sites_list');
	}, 'download_sites_trigger');

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
					if (this.type === 'number') {
						if (this.value)
							crawler[this.parentNode.title] = +this.value;
					} else {
						crawler[this.parentNode.title] = this.value;
					}
				}
			};
		}

		var option_object = {
			span : [ {
				b : download_option
			}, ':', input_box, download_options_set[download_option], ' (',
					arg_types, ')' ],
			C : className,
			title : download_option
		};
		if (!input_box) {
			option_object.onclick = function() {
				var crawler = get_crawler();
				if (!crawler) {
					return;
				}
				crawler[this.title] = !crawler[this.title];
				CeL.set_class(this, 'selected', {
					remove : !crawler[this.title]
				});
			};
		}

		download_options_nodes[download_option] = CeL.new_node(option_object);
		options_nodes.push({
			div : download_options_nodes[download_option],
			C : 'click_item'
		});
	}

	CeL.log([ '<span style="font-size:2em; color:#f88;">',
			'<a href="https://support.microsoft.com/zh-tw/',
			'help/12445/windows-keyboard-shortcuts" target="_blank">',
			'複製貼上快速鍵</a>: Ctrl + C 複製選取的項目,', ' Ctrl + V 貼上選取的項目</span>' ]
			.join(''));

	CeL.new_node(options_nodes, 'download_options_panel');

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
});

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

function get_crawler(just_test) {
	if (!site_used) {
		if (!just_test) {
			CeL.info('請先指定要下載的網站。');
		}
		return;
	}

	CeL.toggle_display('download_options_panel', 'visible');

	var site_id = site_used, crawler = base_directory + site_id + '.js';
	CeL.debug('當前路徑: ' + process.cwd(), 'get_crawler');
	CeL.debug('Load ' + crawler, 'get_crawler');
	crawler = require(crawler);
	if (!(site_id in download_site_nodes.link_of_site)) {
		download_site_nodes.link_of_site[site_id] = crawler.base_URL;
		// add link to site
		CeL.new_node([ ' ', {
			a : '🔗 link',
			href : crawler.base_URL,
			target : '_blank',
			onclick : function() {
				require('electron').shell.openExternal(this.href);
				return false;
			}
		} ], download_site_nodes.node_of_id[site_id].parentNode);
	}

	return crawler;
}

// ----------------------------------------------

function start_gui_crawler() {
	var crawler = get_crawler();
	if (!crawler) {
		return;
	}

	// initialization && initialization();

	var work_id = CeL.node_value('#input_work_id');
	if (work_id) {
		crawler.start(work_id);
	} else {
		CeL.info('請輸入作品名稱。');
	}
}

function stop_task() {
	var crawler = get_crawler();
	crawler && crawler.stop_task();
}

function continue_task() {
	var crawler = get_crawler();
	crawler && crawler.continue_task();
}

function cancel_task() {
	var crawler = get_crawler();
	crawler && crawler.stop_task(true);
}

// ----------------------------------------------

// https://github.com/electron/electron/blob/master/docs/api/shell.md
function open_download_directory() {
	var crawler = get_crawler();
	if (!crawler) {
		return;
	}

	require('electron').shell.openExternal(crawler.main_directory);
}
