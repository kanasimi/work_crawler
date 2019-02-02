/**
 * 批量下載漫画柜的工具。 Download manhuagui comics.
 * 
 * 2017/10: 爱看漫/看漫画改名(DNS被導引到)漫画柜
 * 
 * @see http://www.manhua.demo.shenl.com/?theme=mhd
 * @see qTcms 晴天漫画程序 晴天漫画系统 http://manhua3.qingtiancms.net/
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

// core_9D227AD5A911B7758A332C9CA35C640C.js
// 2017/3/11 20:6:35: core_33A91659E79CDC4A0F31ED884877F3EF.js
// 2018/1/30與2/2之間改版:
// http://c.3qfm.com/scripts/core_E95EAFDD32D7F97E369526C7AD9A8837.js
// 2018/2/14:
// http://cf.hamreus.com/scripts/core_6B1519CED0A3FA5ED82E8FBDA8F1AB90.js
// 2018/3/16 00:17:25 GMT: add https: for image files
// https://cf.hamreus.com/scripts/core_ABBA2B6ADC1DABE325D505BE3314C273.js
var core_filename = 'core_ABBA2B6ADC1DABE325D505BE3314C273.js',
// 2017: main_3A454149B2D2500411BC344B15DB58A4.js'
// 2018/2: http://c.3qfm.com/scripts/config_25855B4C08F7A6545A30D049ABD0F9EE.js
// 2018/2/14:
// http://cf.hamreus.com/scripts/config_25855B4C08F7A6545A30D049ABD0F9EE.js
// 2018/3/11 15:59:14 GMT:
// https://cf.hamreus.com/scripts/config_FAF1BF617BAF8A691A828F80672D3588.js
decode_filename = 'config_FAF1BF617BAF8A691A828F80672D3588.js',
/**
 * e.g., <code>
 <li><a href="/comic/17515/272218.html" title="第72话：一虎进击" class="status0" target="_blank"><span>第72话：一…<i>31p</i><em class="new"></em></span></a></li>

 https://www.manhuagui.com/comic/4076/
 <script type="text/javascript">$.Tabs('#chapter-page-1 li', '#chapter-list-1 ul',{'trigger':'click'});</script><h4><span>单行本</span></h4><div class="chapter-list cf mt10" id='chapter-list-1'><ul style="display:block"><li><a href="/comic/4076/390110.html" title="第67卷" class="status0" target="_blank"><span>第67卷<i>180p</i></span></a></li>
 </code>
 * 
 * [:]: incase href="javascript:;"
 * 
 * matched: [ all, href, title, inner, part_title ]
 */
PATTERN_chapter = /<li><a href="([^"<>:]+)" title="([^"<>]+)"[^<>]*>(.+?)<\/a><\/li>|<h4>(.+?)<\/h4>/g,
//
crawler = new CeL.work_crawler({
	// 本站常常無法取得圖片，因此得多重新檢查。
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。
	// recheck : true,
	one_by_one : true,

	base_URL : 'https://www.manhuagui.com/',
	script_base_URL : 'https://cf.hamreus.com/scripts/',

	// 2018/4: manhuagui 不允許過於頻繁的 access，會直接 ban IP。
	// 當網站不允許太過頻繁的訪問/access時，可以設定下載之前的等待時間(ms)。
	// 模仿實際人工請求。
	// 2018/7/12 22:29:18 9s: NG, ban 2 hr.
	// 10s, 15s 在下載過100章(1 hr)之後一樣會 ban 5hr。
	// 20s, 30s 在下載過200章(~2 hr)之後一樣會 ban。
	// 60s 大致OK
	chapter_time_interval : '20s',

	// 2018/3/3 已經不再有常常出現錯誤的情況。
	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// 取得伺服器列表。
	// use_server_cache : true,
	server_URL : function() {
		return this.script_base_URL + core_filename;
	},
	parse_server_list : function(html) {
		var server_list = [];
		eval(html.between('var servs=', ',pfuncs=')).forEach(function(data) {
			data.hosts.forEach(function(server_data) {
				// @see SMH.utils.getPath() @ ((core_filename))
				server_list.push(server_data.h + '.hamreus.com');
			});
		});
		return server_list;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : '/tools/word.ashx?key=',
	parse_search_result : function(html) {
		/**
		 * e.g.,<code>
		[ { "t": "西游", "u": "/comic/17515/", "s": false, "cid": 272218, "ct": "第72话：一虎进击", "a": "郑健和,邓志辉" } ]
		 </code>
		 */
		var id_data = html ? JSON.parse(html) : [];
		return [ id_data, id_data ];
	},
	id_of_search_result : function(search_result) {
		// e.g., "/comic/123/"
		return +search_result.u.match(/^\/comic\/(\d+)\/$/)[1];
	},
	title_of_search_result : 't',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'comic/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			status : get_label(html.between('<li class="status">', '</span>')
					.between('</strong>')),
			sub_title : get_label(html.between('<h1>', '</div>').between(
					'</h1>')),
			description : get_label(html.between('intro-all', '</div>')
					.between('>'))
		}, data = html.between('detail-list', '</ul>');
		extract_work_data(work_data, data,
		// e.g., "<strong>漫画别名：</strong>暂无</span>"
		/<strong[^<>]*>([^<>]+)<\/strong>(.+?)<\/span>/g);
		if (data = get_label(data.between('<li class="status">', '</li>'))) {
			CeL.log(data);
		}
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		var data, chapter_list = [], matched,
		//
		part_title, part_title_hash = CeL.null_Object(), part_NO = 0;

		// 有些尚使用舊模式。
		// @see http://www.ikanman.com/comic/8004/
		data = html.between('<div class="chapter-bar">',
		// <div class="comment mt10" id="Comment">
		'class="comment')
		// 2017/3/3? ikanman 改版
		|| LZString.decompressFromBase64(
		//
		html.between('id="__VIEWSTATE"', '>').between('value="', '"'));

		while (matched = PATTERN_chapter.exec(data)) {
			// delete matched.input;
			// console.log(matched);
			var chapter_data = get_label(matched[4]);
			// console.log(chapter_data);
			if (chapter_data) {
				// console.log(chapter_data);
				part_title = chapter_data;
				part_title_hash[part_title]
				// last part NO. part_NO starts from 1
				= ++part_NO;
				continue;
			}

			chapter_data = {
				url : matched[1],
				title : get_label(matched[2] + ' '
						+ matched[3].between('<i>', '</i>'))
			};
			if (matched = matched[1].match(/(\d+)\.html$/)) {
				chapter_data.id = matched[1] | 0;
			} else {
				chapter_list.some_without_id = chapter_data;
			}
			if (part_title) {
				chapter_data.part_title = part_title
			}
			chapter_list.push(chapter_data);
		}
		// console.log(chapter_list);

		if (chapter_list.length === 0
		// e.g., <div class="book-btn"><a href="/comic/8772/86612.html"
		// target="_blank" title="1话" class="btn-read">开始阅读</a>
		&& (data = html.between('book-btn', '</a>'))) {
			// 尊敬的看漫画用户，应《》版权方的要求，现已删除屏蔽《》漫画所有卷和册，仅保留作品文字简介
			this.pre_chapter_URL = this._pre_chapter_URL;
			if (Array.isArray(work_data.chapter_list)
					&& work_data.chapter_list.length > 1) {
				work_data.last_download.chapter
				// use cache (old data)
				= work_data.chapter_list.length;
			} else {
				work_data.chapter_list = [ {
					url : data.match(/ href="([^<>"]+)"/)[1],
					title : data.match(/ title="([^<>"]+)"/)[1]
				} ];
			}
			chapter_list = work_data.chapter_list;
		} else {
			if (chapter_list.length > 1) {
				// 轉成由舊至新之順序。
				if (chapter_list.some_without_id) {
					CeL.warn('有些篇章之URL檔名非數字: '
							+ JSON.stringify(chapter_list.some_without_id));
					chapter_list.reverse();
				} else {
					// 按照章節添加時間排序。
					chapter_list.sort(function(a, b) {
						// 排序以.html檔案檔名(序號)為準。
						// assert: 後來的檔名，序號會比較大。
						// @see http://www.ikanman.com/comic/8928/
						return a.id - b.id;
					});
				}
				// console.log(chapter_list);

				if (part_NO > 1) {
					// rearrange part_NO
					chapter_list.part_NO = part_NO;
					// 初始化 NO_in_part
					var NO_in_part_hash = new Array(part_NO + 1).fill(0);
					chapter_list.forEach(function(chapter_data) {
						chapter_data.part_NO
						// 在維持分部順序不動的情況下排序 NO_in_part
						= part_title_hash[chapter_data.part_title];
						chapter_data.NO_in_part
						//
						= ++NO_in_part_hash[chapter_data.part_NO];
					});
					// 重新按照 分部→章節順序 排序。
					chapter_list.sort(function(a, b) {
						// assert: max(NO_in_part) < 1e4
						return (a.part_NO - b.part_NO) * 1e4 + a.NO_in_part
								- b.NO_in_part;
					});
				}
			}
			// console.log(chapter_list);
			// console.log(JSON.stringify(chapter_list));
			// console.log(chapter_list.slice(0, 20));
			// console.log(chapter_list.slice(-20));
			work_data.chapter_list = chapter_list;
		}
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	_pre_chapter_URL : function(work_data, chapter_NO, callback) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		// e.g., "/comic/8772/86612.html"
		chapter_id = +chapter_data.url.match(/^\/comic\/\d+\/(\d+)\.html$/)[1];
		CeL.get_URL(this.base_URL + 'support/chapter.ashx?bid=' + work_data.id
				+ '&cid=' + chapter_id, function(XMLHttp) {
			// console.log(XMLHttp.responseText);
			chapter_data.sibling = JSON.parse(XMLHttp.responseText);
			if (chapter_data.sibling.n > 0
					&& work_data.chapter_count === chapter_NO) {
				// 還有下一chapter。
				work_data.chapter_list.push({
					url : chapter_data.url.replace(/(\d+)\.html$/,
							chapter_data.sibling.n + '.html')
				});
				work_data.chapter_count = work_data.chapter_list.length;
			}
			callback();
		}, null, null, this.get_URL_options);
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// decode chapter data
		function decode_2016(code) {
			code = eval(code);
			eval(code.replace('eval', 'code='));
			eval(code.replace(/^[^=]+/, 'code'));
			return code;
		}

		// 2017/3/3? ikanman 改版
		// String.prototype.splic: used in chapter
		function decode(code) {
			code = eval(code);
			// 2018/3/16 改版
			eval(code.between(null, {
				tail : ').preInit()'
			}).replace('SMH.imgData(', 'code='));
			return code;
		}

		var chapter_data = html.between(
		// window["eval"], window["\x65\x76\x61\x6c"]
		'<script type="text/javascript">window["\\x65\\x76\\x61\\x6c"]',
				'</script>');
		if (!chapter_data || !(chapter_data = decode(chapter_data))) {
			CeL.warn(work_data.title + ' #' + chapter_NO
					+ ': No valid chapter data got!');
			return;
		}
		chapter_data = Object.assign(work_data.chapter_list[chapter_NO - 1],
				chapter_data);
		// for debug
		// console.log(chapter_data);
		// throw this.id + ': debug throw';

		// 設定必要的屬性。
		chapter_data.title = chapter_data.cname;
		chapter_data.image_count = chapter_data.len;

		// e.g., "/ps3/q/qilingu_xmh/第01回上/"
		var path = encodeURI(chapter_data.path),
		// 令牌 @see SMH.utils.getPicUrl() @ ((core_filename))
		token = '?cid=' + chapter_data.cid + '&'
				+ CeL.get_URL.parameters_to_String(chapter_data.sl);
		// 漫畫櫃的webp圖像檔案可能是即時生成的? 大小常常不一樣。
		chapter_data.image_list = chapter_data.files.map(function(url) {
			return {
				url : path + url + token
			}
		});
		// 當一次下載上百張相片的時候，就會被封鎖IP。因此改成一個個下載圖像。
		this.one_by_one = chapter_data.image_list.length > 30;

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

setup_crawler(crawler, typeof module === 'object' && module);

// 創建 main directory。
CeL.create_directory(crawler.main_directory);

var LZString;
CeL.get_URL_cache(crawler.script_base_URL + decode_filename,
// 2017/3/3? ikanman 改版
function(contents) {
	contents = contents.between('\nwindow["\\x65\\x76\\x61\\x6c"]', ';\n')
	//
	.replace(/window\[([^\[\]]+)\]/g, function($0, key) {
		return eval(key);
	});
	contents = eval(contents).replace(/^var /, '');
	eval(contents);
	start_crawler(crawler, typeof module === 'object' && module);
}, crawler.main_directory + decode_filename);
