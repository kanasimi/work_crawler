/**
 * 批量下載 漫画DB 的工具。 Download manhuadb comics.
 * 
 * modify from 9mdm.js
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 本站常常無法取得圖片，因此得多重新檢查。
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。
	// recheck : true,
	// 當無法取得chapter資料時，直接嘗試下一章節。在手動+監視下recheck時可併用此項。
	// skip_chapter_data_error : true,

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// 圖片較多且大，因此採用一個圖一個圖取得的方式。
	one_by_one : true,
	base_URL : 'http://www.manhuadb.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search?q=',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		var id_list = [], id_data = [];
		html.each_between('<div class="comicbook-index', '</div>', function(
				token) {
			// console.log(token);
			var matched = token.match(
			//
			/<a href="\/manhua\/(\d+)" title="([^<>"]+)"/);
			id_list.push(matched[1]);
			id_data.push(get_label(matched[2]));
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'manhua/' + work_id;
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。

			// 選擇性屬性：須配合網站平台更改。
			publish : get_label(html.between(
					'<div class="comic-pub-data-section', '</div>')
					.between('>')),
			synopsis : get_label(html.between(
					'<div class="comic_detail_content">', '</div>'))
		};

		extract_work_data(work_data, html);
		extract_work_data(work_data, html,
				/<th scope="row">([^<>]+)<\/th>([\s\S]*?)<\/td>/g);

		Object.assign(work_data, {
			title : work_data.book_name
		});

		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between('<div class="tab-content"',
				'<div class="comic-detail-section');

		var matched, PATTERN_chapter =
		//
		/<li[\s\S]+?<a [^<>]*?href="([^<>"]+)">([^<>]+)</g;

		work_data.chapter_list = [];
		while (matched = PATTERN_chapter.exec(html)) {
			var chapter_data = {
				url : matched[1],
				title : get_label(matched[2])
			};
			work_data.chapter_list.push(chapter_data);
		}
	},

	pre_parse_chapter_data
	// 執行在解析章節資料process_chapter_data()之前的作業(async)。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		//
		html = XMLHttp.responseText, _this = this, image_page_list = [];

		chapter_data.title = html.between('<h2 class="h4 text-center">',
				'</h2>')
				|| chapter_data.title;

		html.between('id="page-selector"', '</select>').each_between(
		//
		'<option value="', '</option>', function(token) {
			image_page_list.push({
				title : token.between('>'),
				url : token.between(null, '"')
			});
		});
		var image_count = image_page_list.length;

		if (!(image_count >= 0)) {
			throw work_data.title + ' #' + chapter_NO + ' '
					+ chapter_data.title + ': Can not get image count!';
		}

		if (work_data.image_list) {
			chapter_data.image_list = work_data.image_list[chapter_NO - 1];
			if (chapter_data.image_list
					&& chapter_data.image_list.length === image_count) {
				CeL.debug(work_data.title + ' #' + chapter_NO + ' '
						+ chapter_data.title + ': Already got ' + image_count
						+ ' images.');
				callback();
				return;
			}
		} else {
			work_data.image_list = [];
		}

		function extract_image(XMLHttp) {
			var html = XMLHttp.responseText,
			//
			url = html.between('<img class="img-fluid"', '>').between(' src="',
					'"');
			CeL.debug('Add image ' + chapter_data.image_list.length + '/'
					+ image_count + ': ' + url, 2, 'extract_image');
			chapter_data.image_list.push({
				url : url
			});
		}

		chapter_data.image_list = [];
		extract_image(XMLHttp);

		CeL.run_serial(function(run_next, NO, index) {
			var image_page_url
			//
			= _this.full_URL(image_page_list[index - 1].url);
			// console.log('Get #' + index + ': ' + image_page_url);
			process.stdout.write('Get image page ' + NO + '/' + image_count
					+ '...\r');
			CeL.get_URL(image_page_url, function(XMLHttp) {
				extract_image(XMLHttp);
				run_next();
			}, _this.charset, null, Object.assign({
				error_retry : _this.MAX_ERROR_RETRY
			}, _this.get_URL_options));
		}, image_count, 2, function() {
			work_data.image_list[chapter_NO - 1] = chapter_data.image_list;
			callback();
		});
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		// 已在 pre_parse_chapter_data() 設定完 {Array}chapter_data.image_list
		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
