/**
 * 批量下載爱漫画的工具。 Download 2manhua comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var _2manhua = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。
	// recheck : true,
	// 當無法取得chapter資料時，直接嘗試下一章節。在手動+監視下recheck時可併用此項。
	// skip_chapter_data_error : true,

	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	skip_error : true,

	// one_by_one : true,
	base_URL : 'http://www.2manhua.com/',

	// 取得伺服器列表。
	// use_server_cache : true,
	server_URL : function() {
		// http://www.2manhua.com/templates/default/scripts/configs.js?v=1.0.3
		return this.base_URL + 'templates/default/scripts/configs.js';
	},
	parse_server_list : function(html) {
		return Object.values(JSON.parse(
		//
		html.replace(/^[^{]+/, '').replace(/[^}]+$/, '')
		//
		.replace(/'/g, '"')).host)
		//
		.map(function(server_data) {
			return server_data[0];
		});
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'handler/suggest?cb=_&key=',
	parse_search_result : function(html) {
		// e.g.,
		// _([{"id":"28015","t":"民工勇者","u":"/comic/28015/","cid":"/comic/28015/0208","ct":"207话","s":"0"},{"id":"28093","t":"无敌勇者王(民工勇者)","u":"/comic/28093/","cid":"/comic/28093/02","ct":"199话","s":"0"}])
		var id_data = html ? JSON.parse(html.between('(').replace(/\)[^)]*$/,
				'')) : [];
		return [ id_data, id_data ];
	},
	id_of_search_result : function(cached_data) {
		return cached_data.id | 0;
	},
	title_of_search_result : 't',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		// e.g., http://www.2manhua.com/comic/25652.html
		return this.base_URL + 'comic/' + work_id + '.html';
	},
	parse_work_data : function(html, get_label, exact_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : html.between('<h1>', '</h1>'),

			// 選擇性屬性：須配合網站平台更改。
			// <meta property="og:novel:status" content="已完结"/>
			status : html.between('<meta property="og:novel:status" content="',
					'"/>'),
			description : get_label(html.between('"intro-all"', '</div>')
					.between('>'))
		};
		exact_work_data(work_data, html.between('book-detail', 'intro-act'),
				/<strong>([^<>]+?)<\/strong>(.+?)<\/span>/g);
		return work_data;
	},
	get_chapter_count : function(work_data, html) {
		work_data.chapter_list = [];
		var matched,
		/**
		 * e.g., <code>
		<li><a href="/comic/25652/072.html" title="72回 碧霞坠" class="status0" target="_blank"><span>72回<i>14p</i></span></a></li>
		</code>
		 */
		PATTERN_chapter =
		// [all,href,title,inner]
		/<li><a href="([^"<>]+)" title="([^"<>]+)"[^<>]*>(.+?)<\/a><\/li>/g;
		while (matched = PATTERN_chapter.exec(html)) {
			matched[2] = matched[2].trim();
			if (matched[3] = matched[3].between('<i>', '</i>')) {
				matched[2] = matched[2] + ' ' + matched[3];
			}
			work_data.chapter_list.push({
				url : matched[1],
				title : matched[2]
			});
		}
		work_data.chapter_list.sort(function(chapter_data_1, chapter_data_2) {
			var matched_1 = chapter_data_1.url.match(/(\d+)\.htm/),
			// 依照.url排序。
			matched_2 = chapter_data_2.url.match(/(\d+)\.htm/);
			if (matched_1 && matched_2) {
				return matched_1[1] - matched_2[1];
			}
			return chapter_data_1.url < chapter_data_2.url ? -1 : 1;
			// 依照.title排序。
			return chapter_data_1.title < chapter_data_2.title ? -1 : 1;
		});
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter) {
		return work_data.chapter_list[chapter - 1].url;
	},
	parse_chapter_data : function(html, work_data, get_label) {
		// decode chapter data
		function decode(code) {
			code = eval(code).replace(/^[^=]+/, 'code');
			return eval(code);
		}

		var chapter_data = html.between('<script type="text/javascript">eval',
				'\n');
		if (!chapter_data || !(chapter_data = decode(chapter_data))) {
			return;
		}

		// 設定必要的屬性。
		chapter_data.title = get_label(html.between('<h2>', '</h2>'));
		chapter_data.image_count = chapter_data.fc;
		chapter_data.image_list = chapter_data.fs.map(function(url) {
			return {
				url : url
			}
		});

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

_2manhua.start(work_id);
