/**
 * 批量下載哦漫画的工具。 Download omanhua comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var omanhua = new CeL.work_crawler({
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,
	// one_by_one : true,

	base_URL : 'http://www.omanhua.com/',

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

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

var decode_file = 'scripts/show/ssncore.js';
// 創建 main directory。
CeL.create_directory(omanhua.main_directory);
CeL.get_URL_cache(omanhua.base_URL + decode_file, function(contents) {
	// var servs = [{...
	omanhua.start(work_id);
}, omanhua.main_directory + decode_file.match(/[^\\\/]+$/)[0]);
