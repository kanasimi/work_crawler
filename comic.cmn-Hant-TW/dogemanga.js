/**
 * 批量下載 漫畫狗 - 網路漫畫上傳分享平台 的工具。 Download dogemanga comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,
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
			id_list.push(decodeURIComponent(
			//
			token.between('<a class="site-link" href="', '"').between('/m/'))
			//
			.replace(/\/(\w+)$/, '_$1'));
			id_data.push(token.between('alt="', '"'));
		});
		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'm/' + encodeURIComponent(work_id).replace(/_(\w+)$/, '/$1');
	},
	parse_work_data : function(html, get_label, extract_work_data) {
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

		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		work_data.chapter_list = [];
		html = html.between(' id="site-manga-all"', '<footer ');
		html.each_between('<div class="site-manga">', null, function(token) {
			var matched = token
			//
			.match(/<a class="site-link" href="([^"]+)">([\s\S]+?)<\/a>/);
			work_data.chapter_list.push({
				title : get_label(matched[2]),
				url : matched[1]
			});
		});
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);
		var chapter_data = {
			title : get_label(html.between('<title>', '</title>')
					.between(' - ')),
			image_list : []
		};
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
