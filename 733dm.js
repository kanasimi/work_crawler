/**
 * 批量下載733动漫网的工具。 Download 733dm comics.
 */

'use strict';

require('./work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run([
// CeL.character.load()
'data.character'
// CeL.detect_HTML_language()
, 'application.locale' ]);

var charset = 'gb2312';
CeL.character.load(charset);

var _733dm = new CeL.work_crawler({
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	skip_error : true,

	// one_by_one : true,
	base_URL : 'http://www.733dm.net/',
	charset : charset,

	// 取得伺服器列表。
	// http://www.733dm.net/skin/2014mh/global.js
	// use_server_cache : true,

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return [ this.base_URL + 'e/search/index.php', {
			show : 'title',
			keyboard : work_title
		} ];
	},
	parse_search_result : function(html) {
		html = html.between('id="dmList"', '</div>');
		var id_list = [], id_data = [];
		html.each_between('<li>', '</li>', function(token) {
			var matched = token
					.match(/<dt><a href="\/mh\/(\d+)" title="([^"]+)">/);
			id_list.push(matched[1]);
			id_data.push(matched[2]);
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'mh/' + work_id + '/';
	},
	parse_work_data : function(html, get_label) {
		var text = html
				.between('<div class="detailInfo">', '<div class="intro'),
		// work_data={id,title,author,authors,chapters,last_update,last_download:{date,chapter}}
		work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(
			//
			text.between('<div class="titleInfo">', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			status : get_label(text.between('</h1><span>', '</span>')),
			description : get_label(html.between(
					'<div class="introduction" id="intro1">', '</div>'))
		};
		text.each_between('<li class="twoCol">', '</li>', function(token) {
			work_data[get_label(token.between('<span>', '</span>')).replace(
					/：$/, '')] = get_label(token.between('</span>'));
		});
		work_data.author = work_data.作者;
		work_data.last_update = work_data.更新时间;
		return work_data;
	},
	get_chapter_count : function(work_data, html) {
		html = html.between('<div id="section">', '<div class="description">');
		work_data.chapter_list = [];
		var matched,
		// [ , chapter_url, chapter_title ]
		PATTERN_chapter = /<a href="(\/mh\/[^"]+)" title="([^"]+)"/g;
		while (matched = PATTERN_chapter.exec(html)) {
			work_data.chapter_list.push({
				url : matched[1],
				title : matched[2]
			});
		}
		if (work_data.chapter_list.length > 1) {
			// 轉成由舊至新之順序。
			work_data.chapter_list.reverse();
		}
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter) {
		return work_data.chapter_list[chapter - 1].url;
	},
	parse_chapter_data : function(html, work_data) {
		function decode(packed) {
			var photosr = [];
			// decode chapter data @ every picture page
			eval(eval(Buffer.from(packed, 'base64').toString().slice(4)));
			// 通常[0]===undefined
			return photosr.filter(function(url) {
				return url;
			});
		}

		var chapter_data = html.between('packed="', '"');
		if (!chapter_data || !(chapter_data = decode(chapter_data))) {
			return;
		}
		// console.log(JSON.stringify(chapter_data));
		// console.log(chapter_data.length);
		// CeL.set_debug(6);

		// 設定必要的屬性。
		chapter_data = {
			image_list : chapter_data.map(function(url) {
				return {
					// http://733dm.xxjcw.com.cn/
					url : 'http://733dm.zgkouqiang.cn/' + url
				};
			})
		};
		// console.log(JSON.stringify(chapter_data));

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

_733dm.start(work_id);
