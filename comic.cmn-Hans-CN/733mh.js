/**
 * 批量下載733漫画网的工具。 Download 733mh comics.
 * 
 * @see qTcms 晴天漫画程序 晴天漫画系统 http://manhua.qingtiancms.com/
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

	// one_by_one : true,

	// 2018/6/4 6:34 最後一次成功存取 http://www.733mh.com/
	// 之後更改域名
	base_URL : 'http://www.733mh.net/',
	charset : 'gb2312',

	// 取得伺服器列表。
	// use_server_cache : true,
	// http://www.733mh.com/style/js/global.js
	server_URL : 'style/js/global.js',
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
	search_URL : 'e/search/'
			+ '?searchget=1&show=title,player,playadmin,pinyin&keyboard=',
	parse_search_result : function(html) {
		var id_list = [], id_data = [], matched, PATTERN =
		/**
		 * e.g., <code>
		<dt><a href="/mh/27576" title="时空使徒">时空使徒</a></dt>
		</code>
		 */
		/<a href="\/mh\/(\d+)\/?" title="([^"<>]+)">/g;
		while (matched = PATTERN.exec(html)) {
			id_list.push(+matched[1]);
			id_data.push(matched[2]);
		}
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'mh/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(
			//
			html.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			description : get_label(html.between(
					'<div class="introduction" id="intro1">', '</div>'))
		};
		// 由 meta data 取得作品資訊。
		extract_work_data(work_data, html);
		extract_work_data(work_data, html.between('<div class="info">',
				'<div class="info_cover">'),
				/<em>([^<>]+?)<\/em>([\s\S]*?)<\/p>/g);

		work_data.author = work_data.原著作者;
		work_data.last_update = work_data.更新时间;
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between('<div class="w980_b1px mt10 clearfix">',
				'<div class="introduction" id="intro1">').between('<ul>',
				'</ul>');
		/**
		 * e.g., <code>
		<li><a href="/mh/27576/359123.html" title="179：失踪">179：失踪</a></li>
		</code>
		 */
		work_data.chapter_list = [];
		work_data.inverted_order = true;
		var matched, PATTERN_chapter =
		// [ , chapter_url, chapter_title ]
		/<a href="(\/mh\/[^<>"]+)" title="([^<>"]+)"/g;
		while (matched = PATTERN_chapter.exec(html)) {
			work_data.chapter_list.push({
				url : matched[1],
				title : get_label(matched[2])
			});
		}
	},

	parse_chapter_data : function(html, work_data) {
		function decode(packed) {
			var photosr = [];
			// decode chapter data @ every picture page
			eval(eval(Buffer.from(packed, 'base64').toString().slice(4)));
			// 通常[0]===undefined
			return photosr.filter(function(url) {
				return !!url;
			});
		}

		var chapter_data = html.between('packed="', '"');
		if (chapter_data) {
			chapter_data = decode(chapter_data);
		} else if (chapter_data = html.between('photosr[1] ="',
				'var maxpages=photosr.length-1;')) {
			// e.g., http://www.733mh.net/mh/18102/465176.html
			var photosr = [];
			eval('photosr[1] ="' + chapter_data);
			photosr.shift();
			chapter_data = photosr;
		}
		if (!chapter_data) {
			CeL.log('無法解析資料！');
			return;
		}
		// console.log(JSON.stringify(chapter_data));
		// console.log(chapter_data.length);
		// CeL.set_debug(6);

		// 設定必要的屬性。
		chapter_data = {
			image_list : chapter_data.map(function(url) {
				return {
					url : url
				};
			})
		};
		// console.log(JSON.stringify(chapter_data));

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
