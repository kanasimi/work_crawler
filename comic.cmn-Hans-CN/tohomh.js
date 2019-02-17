/**
 * 批量下載土豪漫画的工具。 Download tohomh comics.
 * 
 * @see dm5.js
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。
	// recheck : true,
	// 當有多個分部的時候才重新檢查。
	recheck : 'multi_parts_changed',
	// 當無法取得chapter資料時，直接嘗試下一章節。在手動+監視下recheck時可併用此項。
	// skip_chapter_data_error : true,

	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// one_by_one : true,
	// 2019/1/21 土豪漫畫網址更動 ← https://www.tohomh.com/
	base_URL : 'https://www.tohomh123.com/',

	preserve_chapter_page : false,
	// 提取出引數（如 URL）中的作品ID 以回傳。
	extract_work_id : function(work_information) {
		// /^manhua-[a-z\-\d]+$/;
		// e.g., http://www.dm5.com/manhua-1122/
		// http://www.dm5.com/manhua--c-94-okazu/
		return /^[a-z\-\d]+$/.test(work_information) && work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'action/Search?keyword=',
	parse_search_result : function(html, get_label) {
		var id_list = [], id_data = [];
		html.each_between('<div class="mh-item">', '</li>',
		/**
		 * e.g., <code>
		<li>\n\s<div class="mh-item"><a href="/title/" title="title">
		</code>
		 */
		function(text) {
			var matched = text
					.match(/<a href="\/([^<>"\/]+)\/" title="([^<>"]+)">/);
			id_list.push(matched[1]);
			id_data.push(get_label(matched[2]));
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	parse_work_data : function(html, get_label, extract_work_data) {
		var part_list = [], matched,
		//
		text = html.between('<div class="detail-list-title">', '</div>'),
		//
		PATTERN = /['"]detail-list-select-(\d)['"][^<>]+>([^<>]+)/g;
		while (matched = PATTERN.exec(text)) {
			part_list[matched[1]] = get_label(matched[2]);
		}

		matched = text.between('最新').match(/<a [^<>]*?title="([^<>"]+)"/);

		html = html.between('<div class="banner_detail_form">',
				'<div class="bottom"');

		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<p class="title">',
					'<span class="right">')
					// 土豪漫画
					|| html.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			// e.g., "<p class="subtitle">作者：...图：.../文：...</p>"
			author : get_label(html.between('<p class="subtitle">', '</p>')),
			description : get_label(html.between('<p class="content"', '</p>')
					.between('>').replace(/<a href="#[^<>]+>.+?<\/a>/g, '')),
			image : html.between('<img src="', '"'),
			score : html.between('<span class="score">', '</span>'),
			// 土豪漫画: <em class="remind">每周六更</em>
			next_update : html.between(' class="remind">', '<'),
			part_list : part_list
		};

		if (!/[:：][^:：]+?[:：]/.test(work_data.author)) {
			work_data.author = work_data.author.replace(/^.*?[:：]/, '');
		}

		if (matched) {
			work_data.latest_chapter = matched[1];
		}

		html.between('<p class="tip">', '<p class="content"')
		// <span class="block ticai">题材：...
		.split('<span class="block').forEach(function(text) {
			var matched = text.match(/^[^<>]+>([^<>:：]+)([\s\S]+)$/);
			if (matched && (matched[2] = get_label(matched[2])
			//
			.replace(/^[\s:：]+/, '').trim().replace(/\s+/g, ' '))) {
				work_data[matched[1]] = matched[2];
			}
		});

		Object.assign(work_data, {
			status : work_data.状态,
			last_update : work_data.更新时间
		});

		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		var is_dm5 = html.includes('DM5_COMIC_SORT');
		// 1: 由舊至新, 2: 由新至舊
		work_data.inverted_order = !/ DM5_COMIC_SORT\s*=\s*1/.test(html);

		html = html.between('detail-list-select', '<div class="index-title">');

		// reset work_data.chapter_list
		work_data.chapter_list = [];
		// 漫畫目錄名稱不須包含分部號碼。使章節目錄名稱不包含 part_NO。
		work_data.chapter_list.add_part_NO = false;

		var PATTERN_chapter = /<li>([\s\S]+?)<\/li>|<ul ([^<>]+)>/g, matched;
		while (matched = PATTERN_chapter.exec(html)) {
			if (matched[2]) {
				// <ul class="view-detail-list detail-list-select"
				// id="detail-list-select-1">
				matched[2] = matched[2].match(/ id="detail-list-select-(\d)"/);
				if (matched[2]
						&& (matched[2] = work_data.part_list[matched[2][1]])) {
					this.set_part(work_data, matched[2]);
				} else if (!matched[0].includes(' class="chapteritem">')) {
					// <ul style="display:none" class="chapteritem">
					if (!is_dm5) {
						break;
					}
					CeL.error('get_chapter_list: Invalid NO: ' + matched[0]);
				}
				continue;
			}

			matched = matched[1];
			var chapter_data = {
				title : get_label(matched.between(' class="title', '</p>')
						.between('>'))
						// e.g., 古惑仔
						|| get_label(matched
						// for 七原罪 第168话 <十戒>歼灭计划
						.replace(/ title="[^"]+"/, '')).replace(/\s+/g, ' ')
						// 土豪漫画
						|| get_label(matched
						// <a href="/title/1.html" ...>title<span>（1P）</span>
						// </a>
						.match(/<a [^<>]+>([\s\S]+?)<\/span>/)[1]),

				url : matched.between(' href="', '"')
			};
			matched = get_label(matched.between('<p class="tip">', '</p>'));
			if (matched) {
				chapter_data[Date.parse(matched) ? 'date' : 'tip'] = matched;
			}
			this.add_chapter(work_data, chapter_data);
		}
		// console.log(work_data);
	},

	pre_parse_chapter_data
	// 執行在解析章節資料 process_chapter_data() 之前的作業 (async)。
	// 必須自行保證執行 callback()，不丟出異常、中斷。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		// console.log(XMLHttp);
		// console.log(work_data);
		if (!work_data.image_list) {
			// image_list[chapter_NO] = [url, url, ...]
			work_data.image_list = [];
		} else if (work_data.chapter_list[chapter_NO - 1].image_list
		//
		= work_data.image_list[chapter_NO - 1]) {
			callback();
			return;
		}

		var html = XMLHttp.responseText;
		// console.log(html);
		if (!html) {
			// e.g., 雏蜂 https://www.tohomh.com/chufeng/259.html
			// node tohomh.js 雏蜂 skip_error
			delete work_data.chapter_list[chapter_NO - 1];
			callback();
			return;
		}

		var image_list = work_data.image_list[chapter_NO - 1]
		//
		= work_data.chapter_list[chapter_NO - 1].image_list = [
		// 第一張圖片的網址在網頁中。
		// <div class="comiclist">\n <div class="comicpage">\n <img src="..."
		html.between(' class="comiclist"', '</div>').between(' src="', '"') ];

		html = html.match(
		//
		/<script[^<>]*>[\n\s]*var\s+([\s\S]+?)<\/script>/)[1];
		// console.log(html);
		var config = Object.create(null), matched, PATTERN =
		//
		/[\s\n;]var\s+([a-z]+)\s*=\s*(\d+|[a-z]+|'[^']*'|"[^"]*")/ig;
		while (matched = PATTERN.exec(html)) {
			config[matched[1]] = eval(matched[2]);
		}
		// console.log(config);
		var _this = this, base_URL = 'action/play/read?did=' + config.did
				+ '&sid=' + config.sid + '&iid=', image_count = config.pcount;
		if (!image_list[0].includes('://')) {
			// 2019/2/5 13:-17: 間改版。
			// assert: image_list[0].startsWith('data:image/')
			image_list[0] = config.pl;
		}

		if (!(image_count >= 1)) {
			// e.g., https://www.tohomh.com/shijie/276.html
			this.onwarning(this.id + ': Failed to get chapter page of #'
					+ chapter_NO, work_data);
			image_list.truncate();
			callback();
			return;
		}

		CeL.run_serial(function(run_next, image_NO) {
			// @see https://manhua.wzlzs.com/muban/mh/js/p.js?20181207
			function add_image_data(XMLHttp) {
				// console.log(XMLHttp.responseText);
				var image_data;
				try {
					image_data
					// {"IsError":false,"MessageStr":null,"Code":"https://mh2.ahjsny.com/upload/id/0001/0001.jpg"}
					= encodeURI(JSON.parse(XMLHttp.responseText).Code);
				} catch (e) {
					// e.g., status 500
					if (_this.skip_error) {
						_this.onwarning(e);
					} else {
						_this.onerror(e);
					}
				}
				image_list.push(image_data);
				run_next();
			}

			process.stdout.write('Get image data pages of #' + chapter_NO
					+ ': ' + image_NO + '/' + image_count + '...\r');

			_this.get_URL(base_URL + image_NO + '&tmp=' + Math.random(),
					add_image_data);
		}, image_count, config.iid, callback);
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
