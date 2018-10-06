/**
 * 批量下載733动漫网的工具。 Download 733dm comics.
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
	skip_error : true,

	// 最小容許圖案檔案大小 (bytes)。

	// 因為要經過轉址，所以一個圖一個圖來。
	one_by_one : true,
	// 2018/3: https://www.733dm.net/
	base_URL : 'https://www.733.so/',
	charset : 'gb2312',

	// 取得伺服器列表。
	// use_server_cache : true,
	// /skin/2014mh/global.js
	server_URL : 'skin/2014mh/global.js',
	parse_server_list : function(html) {
		var server_list = [],
		// e.g., WebimgServerURL[0]="http://img.tsjjx.com/"
		// WebimgServerURL[0]="http://www.733mh.com/fd.php?url=http://img.tsjjx.com/";
		matched, PATTERN = /\nWebimgServerURL\[\d\]\s*=\s*"([^"]+)"/g;
		while (matched = PATTERN.exec(html)) {
			server_list.push(matched[1].between('url=') || matched[1]);
		}
		// console.log(server_list);
		return server_list;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : {
		URL : 'http://so.733dm.net/cse/search?s=12232769419968673741&q=',
		charset : 'UTF-8'
	},
	// for 百度站内搜索工具。非百度搜索系統得要自己撰寫。
	parse_search_result : 'baidu',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return '/mh/' + work_id + '/';
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
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between('<div id="section">', '<div class="description">');
		work_data.chapter_list = [];
		var matched,
		// [ , chapter_url, chapter_title ]
		PATTERN_chapter = /<a href="(\/mh\/[^"]+)" title="([^"]+)"/g;
		while (matched = PATTERN_chapter.exec(html)) {
			work_data.chapter_list.push({
				url : matched[1],
				title : get_label(matched[2])
			});
		}
		if (work_data.chapter_list.length > 1) {
			// 轉成由舊至新之順序。
			work_data.chapter_list.reverse();
		}
		// console.log(work_data);
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		function decode(packed) {
			var photosr = [];
			// decode chapter data @ every picture page
			eval(eval(atob(packed).slice(4)));
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

		var chapter_URL = this.chapter_URL(work_data, chapter_NO);

		// 設定必要的屬性。
		chapter_data = {
			image_list : chapter_data.map(function(url, index) {
				// @see https://www.733.so/skin/2014mh/global.js?v=003 line 434
				// https://www.733.so/skin/2014mh/view.js line 97
				return {
					// 此 URL 會再轉址至圖片真實網址。
					url : chapter_URL + "&mode=pc&hash="
					// create md5 hash from string, hex_md5()
					+ require('crypto').createHash('md5')
					// 就算給一個錯誤的雜湊值似乎也可以獲得正確的檔案？
					.update(chapter_URL + url).digest('hex') + "&file=" + url
				};
			})
		};
		// console.log(JSON.stringify(chapter_data));
		// console.log(chapter_data);

		return chapter_data;
	},
	// 檢測用，不應該有實際作用。
	image_preprocessor : function(contents, image_data) {
		if (contents && contents.length === 99242) {
			if (contents.slice(99000, 99020).toString('hex') ===
			// 99242: @see #19
			'5a925a19be65b31fac5555a73155540555501555')
				throw this.id + ' 改版了!';
		}
	}

});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
