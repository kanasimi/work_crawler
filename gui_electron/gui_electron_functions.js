/**
 * 新增或更新網站的時候，除了.js功能寫完之外，還必須要更改 README.md 以及本檔案中的 download_sites_set。
 */

// work_crawler/
var base_directory = '../', site_used,
//
site_type_description = {
	'comic.cmn-Hans-CN' : '中国内地漫画',
	'novel.cmn-Hans-CN' : '中国内地小说',
	'novel.ja-JP' : '日本のオンライン小説'
},
//
download_sites_set = {
	'comic.cmn-Hans-CN' : {
		'2manhua' : '爱漫画',
		'163' : '网易漫画',
		'733dm' : '733动漫网',
		'733mh' : '733漫画网',
		dmzj : '动漫之家',
		gufengmh : '古风漫画网',
		hhcool : '汗汗酷漫',
		kuaikanmanhua : '快看漫画',
		manhuagui : '看漫画/漫画柜',
		manhuatai : '漫画台',
		omanhua : '哦漫画',
		qq : '腾讯漫画'
	},
	'novel.cmn-Hans-CN' : {
		'23us' : '顶点小说',
		'81xsw' : '八一中文网',
		'88dushu' : '八八读书网',
		'630book' : '恋上你看书网',
		ck101 : '卡提諾論壇 小說頻道',
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
download_options_set = {
	recheck : '從頭檢測所有作品之所有章節與所有圖片。',
	// 重新擷取用的相關操作設定。
	regenerate : '章節數量無變化時依舊利用 cache 重建資料(如ebook)。',
	reget_chapter : '重新取得每個所檢測的章節內容。',

	// 容許錯誤用的相關操作設定。
	// MAX_ERROR : '',
	allow_EOI_error : '當圖像不存在 EOI (end of image) 標記，或是被偵測出非圖像時，依舊強制儲存檔案。',
	skip_error : '忽略/跳過圖像錯誤。',
	skip_chapter_data_error : '當無法取得 chapter 資料時，直接嘗試下一章節。',

	// main_directory : '',
	// user_agent : '',
	one_by_one : '循序逐個、一個個下載圖像。僅對漫畫有用，對小說無用。'
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
	CeL.new_node(site_nodes, 'download_sites_panel');

	var options_nodes = [];
	for ( var download_option in download_options_set) {
		download_options_nodes[download_option] = CeL.new_node({
			span : [ {
				b : download_option
			}, ':', download_options_set[download_option] ],
			C : 'download_options',
			title : download_option,
			onclick : function() {
				var crawler = get_crawler();
				if (!crawler) {
					return;
				}
				crawler[this.title] = !crawler[this.title];
				CeL.set_class(this, 'selected', {
					remove : !crawler[this.title]
				});
			}
		});
		options_nodes.push({
			div : download_options_nodes[download_option],
			C : 'click_item'
		});
	}

	CeL.new_node(options_nodes, 'download_options_panel');
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
		var download_options_node = download_options_nodes[download_option];
		CeL.set_class(download_options_node, 'selected', {
			remove : !crawler[download_option]
		});
	}
}

function get_crawler(just_test) {
	if (!site_used) {
		if (!just_test) {
			CeL.info('請先指定要下載的網站。');
		}
		return;
	}

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