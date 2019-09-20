/**
 * 批量下載 漫畫狗 - 網路漫畫上傳分享平台 的工具。 Download dogemanga comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

// e.g., "苏生战铳2（全彩版）/F9SblBJ_"
var PATTERN_id_last_part = /\/([a-zA-Z\d\-_]{8})$/;
// or '_'
var id_separator = ' ';
var id_revert_to;
var PATTERN_converted_id_last_part = new RegExp(PATTERN_id_last_part.source
		.replace(/^\\(.)/, function(all, prefix) {
			// `prefix` should be '/'
			id_revert_to = prefix + '$1';
			return '\\' + id_separator;
		}));
// console.log(PATTERN_converted_id_last_part);
if (!id_revert_to) {
	throw new Error('dogemanga: ' + '無法判別程式需要用到的關鍵數值：' + 'id_revert_to');
}

var crawler = new CeL.work_crawler({
	// recheck:從頭檢測所有作品之所有章節。
	recheck : 'multi_parts_changed',

	// one_by_one : true,
	base_URL : 'https://dogemanga.com/',

	// 最小容許圖案檔案大小 (bytes)。
	// 對於極少出現錯誤的網站，可以設定一個比較小的數值，並且設定.allow_EOI_error=false。因為這類型的網站要不是無法取得檔案，要不就是能夠取得完整的檔案；要取得破損檔案，並且已通過EOI測試的機會比較少。
	// 對於有些圖片只有一條細橫桿的情況。
	// MIN_LENGTH : 150,

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	skip_error : true,

	// e.g., 真实帐号_5OQyYNTL/0001 第1话 Opening
	acceptable_types : 'png',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : '?q=',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		var
		// {Array}id_list = [ id, id, ... ]
		id_list = [],
		// {Array}id_data = [ title, title, ... ]
		id_data = [];

		html.between(' id="site-search-result-list"', '<footer')
		//
		.each_between('<div class="site-thumbnail-box mb-3 mx-auto">', null,
		//
		function(token) {
			id_list.push(decodeURI(
			//
			token.between('<a class="site-link" href="', '"').between('/m/'))
			//
			.replace(PATTERN_id_last_part, id_separator + '$1'));
			id_data.push(token.between('alt="', '"'));
		});
		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'm/'
				// includes "/", so can not use encodeURIComponent()
				+ encodeURI(work_id.replace(PATTERN_converted_id_last_part,
						id_revert_to));
	},
	parse_work_data : function(html, get_label, extract_work_data, options) {
		var work_data = html
				.between('<ul class="list-unstyled mb-2">', '</ul>');
		work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between(
					'<h2 class="site-red-dot-box" style="display: inline">',
					'</h2>')),
			author : get_label(html.between('<h4>', '</h4>')),
			status : work_data.between('連載狀態：', '</li>'),

			// 選擇性屬性：須配合網站平台更改。
			description : get_label(html
			//
			.between(' id="manga-brief">', '</p>')),
			last_update : work_data.between('最近更新：', '</li>')
		};

		// 允許自訂作品目錄名/命名資料夾。
		// console.log([ options.id, work_data.title ]);
		if (options.id.includes(work_data.title)) {
			// 由於 work id 已經包含作品名稱，因此不再重複作品名稱部分。
			work_data.directory_name = options.id;
		}

		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		var id_to_part_title = {
			'site-manga-all' : '全部'
		};
		html.each_between('<li class="nav-item">', '</li>', function(token) {
			id_to_part_title[token.between(' href="#', '"')]
			//
			= get_label(token);
		});
		// console.log(id_to_part_title);

		work_data.chapter_list = [];
		work_data.inverted_order = true;

		html = html.between('<div class="tab-content">', '<footer ');

		var part_id_now;
		// e.g., 進擊的巨人https://dogemanga.com/m/進擊的巨人/3E6-dFJl
		for ( var id in id_to_part_title) {
			if (part_id_now) {
				if (part_id_now === 'site-manga-all') {
					this.reverse_chapter_list_order(work_data);
					work_data.all_chapter_list = work_data.chapter_list;
					// CeL.debug('reset work_data.chapter_list', 1);
					work_data.chapter_list = [];
				}
			} else if (id !== 'site-manga-all') {
				throw new Error(work_data.id + ': 首個部分 ['
				//
				+ id + ':' + id_to_part_title[id]
						+ '] 並非 "site-manga-all"，網站改版？');
			}
			part_id_now = id;
			// console.log(id + ':' + id_to_part_title[id]);
			this.set_part(work_data, id_to_part_title[id]);
			// console.log(work_data.chapter_list);
			var text = ' id="' + id + '"';
			var _this = this;
			text = html.between(text, '<div class="tab-pane')
					|| html.between(text);
			if (!text) {
				throw new Error(work_data.id + ': Can not find id: ' + id);
			}
			// console.log(JSON.stringify(text));
			text.each_between('<div class="site-manga">', null,
			//
			function(token) {
				var matched = token.match(
				//
				/<a class="site-link" href="([^"]+)">([\s\S]+?)<\/a>/
				//
				);
				_this.add_chapter(work_data, {
					title : get_label(matched[2]),
					url : matched[1]
				});
			});
		}

		if (work_data.all_chapter_list) {
			if (work_data.all_chapter_list.length
			//
			!== work_data.chapter_list.length) {
				throw new Error(work_data.id + ': 章節數量不符: 全部 '
						+ work_data.all_chapter_list.length + ' ≠ 分部總和 '
						+ work_data.chapter_list.length);
			}
			// work_data.all_chapter_list 記錄了依添加時間的章節順序？
			// delete work_data.all_chapter_list;
		}
		// console.log(JSON.stringify(work_data.all_chapter_list));
		// console.log(JSON.stringify(work_data.chapter_list));
		// console.log(!!work_data.all_chapter_list);
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);
		var chapter_data = Object.assign(
		//
		work_data.chapter_list[chapter_NO - 1], {
			title : get_label(html.between('<title>', '</title>')
					.between(' - ')),
			image_list : []
		});
		html = html.between(' id="site-page-slides-box">',
				' id="site-page-slides-publication-selection-modal"');
		html.each_between('<img ', '>', function(token) {
			chapter_data.image_list.push({
				title : get_label(token.between(' alt="', '"')),
				url : token.between(' data-src="', '"')
						|| token.between(' src="', '"')
			});
		});

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
