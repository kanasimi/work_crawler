/**
 * 批量下載哦漫画的工具。 Download omanhua comics.
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

	// one_by_one : true,
	base_URL : 'http://www.omanhua.com/',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return this.base_URL + 'comic/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, exact_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between("<h2 class='fleft blue'>", '漫画')),

			// 選擇性屬性：須配合網站平台更改。
			status : get_label(html.between("<h2 class='fleft blue'>",
					'</FONT>').between('<FONT color=red>')),
			description : get_label(html.between(
					"<div class='cartoon_infos line_height'>", '</p>'))
		}, data = html.between("<div class='main01-title01 font_a_1'>",
				'</div>');
		exact_work_data(work_data, data,
		// e.g., "<li><span class='gray'>作者：</span>...</li>"
		/<li><span class='gray'>([^<>]+)<\/span>(.+?)<\/li>/g);
		if (work_data.更新时间)
			work_data.last_update = work_data.更新时间;
		return work_data;
	},
	get_chapter_count : function(work_data, html) {
		var data, chapter_list = [], matched, PATTERN_chapter =
		//
		/<li><a href='([^'<>:]+)' title='([^'<>]+)'[^<>]*>(.+?)<\/a><\/li>/g;

		data = html.between('<div class="subBookList">', '</div>');

		while (matched = PATTERN_chapter.exec(data)) {
			var chapter_data = {
				url : matched[1],
				title : matched[2]
			};
			chapter_list.push(chapter_data);
		}
		work_data.chapter_list = chapter_list.reverse();
	},

	parse_chapter_data : function(html, work_data, get_label, chapter) {

		function decode(code) {
			code = eval(code);
			eval(code.replace('var cInfo=', 'code='));
			return code;
		}

		var chapter_data = html.between(';eval', '</script>');
		if (!chapter_data || !(chapter_data = decode(chapter_data))) {
			CeL.warn(work_data.title + ' #' + chapter
					+ ': No valid chapter data got!');
			return;
		}

		// 設定必要的屬性。
		chapter_data.title = chapter_data.cname;
		chapter_data.image_count = chapter_data.len;
		// e.g., "/ps3/q/qilingu_xmh/第01回上/"
		var path = encodeURI(chapter_data.path);
		chapter_data.image_list = chapter_data.files.map(function(url) {
			return {
				// @see http://www.omanhua.com/scripts/show/ssncore.js
				url : "http://pic.fxdm.cc" + path + url
			}
		});

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

setup_crawler(crawler, typeof module === 'object' && module);

var decode_file = 'scripts/show/ssncore.js';
// 創建 main directory。
CeL.create_directory(crawler.main_directory);
CeL.get_URL_cache(crawler.base_URL + decode_file, function(contents) {
	// var servs = [{...
	start_crawler(crawler, typeof module === 'object' && module);
}, crawler.main_directory + decode_file.match(/[^\\\/]+$/)[0]);
