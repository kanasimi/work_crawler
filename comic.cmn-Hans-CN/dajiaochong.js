/**
 * 批量下載 大角虫漫画_超有爱的日更原创国漫平台 的工具。 Download dajiaochongmanhua comics.
 * 
 * @since 2018/3/17 8:7:55
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// one_by_one : true,
	base_URL : 'https://www.dajiaochongmanhua.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search/index/search.html?str=',
	parse_search_result : function(html, get_label) {
		var id_list = [], id_data = [];
		html.each_between('<div class="ret_booktails">', '</div>',
		/**
		 * e.g., <code>
		<div class="ret_booktails"><div class="clearfix"><a href="/detail/?bookid=4052" target="_blank"><p class="ret_bkname">校花大作战</p></a>
		</code>
		 */
		function(text) {
			id_list.push(+text.between('<a href="/detail/?bookid=', '"'));
			id_data.push(get_label(text.between('<p class="ret_bkname">',
					'</p>')));
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'detail/?bookid=' + work_id;
	},
	parse_work_data : function(html, get_label, exact_work_data) {
		var data = html.between('<div class="detail-book-info">',
				'<div class="book-section"'),
		//
		work_data = {
			// 必要屬性：須配合網站平台更改。

			// 選擇性屬性：須配合網站平台更改。
			status : get_label(data.between('<p class="detail-book-type">',
					'</b>'))
		};
		exact_work_data(work_data, html);
		exact_work_data(work_data, data,
		// e.g., "<p class="detail-book-author">作者</p>"
		/<p class="detail-book-([^<>"]+)">([\s\S]*?)<\/p>/g);
		exact_work_data(work_data, data.between('<p class="detail-book-type">',
				'</p>'),
		// e.g.,
		// "<b>一周三更</b><i>上次更新</i><b>2018-03-16</b><i>点击</i><b>9.8亿</b><i>人气</i><b>5.2亿</b>"
		/<i>(.+?)<\/i><b>(.*?)<\/b>/g);

		Object.assign(work_data, {
			title : work_data.name,
			last_update : work_data.上次更新
		});

		return work_data;
	},
	pre_get_chapter_list_via_api : function(callback, work_data, html) {
		// 用這個方法獲得的資訊比較完整。但是必須取得多個檔案。
		var _this = this, last_list_NO = html.between(
				'<div class="section-tag-list">', '</div>').match(
				/<li index="(\d+)">[\s\S]+?<\/li>/g);
		last_list_NO = +last_list_NO.pop().match(
				/<li index="(\d+)">[\s\S]+?<\/li>/)[1];

		work_data.chapter_list = [];

		CeL.run_serial(function(run_next, item, index, list) {
			CeL.get_URL(_this.base_URL + 'chaptshow?bookid=' + work_data.id
					+ '&start=' + item + '&userid=0&view_type=0&_='
					+ Date.now(), function(XMLHttp) {
				var chapter_list_token = JSON.parse(XMLHttp.responseText);
				work_data.chapter_list.append(chapter_list_token.data.data);
				run_next();

			}, _this.charset, null, Object.assign({
				error_retry : _this.MAX_ERROR_RETRY
			}, _this.get_URL_options));

		}, last_list_NO, 1, function() {
			work_data.chapter_list.forEach(function(chapter_data) {
				chapter_data.url = 'read/?cid=' + chapter_data.cid;
			});
			callback();
		});
	},
	pre_get_chapter_list : function(callback, work_data, html, get_label) {
		var PATTERN_chapter_url = / href="\/(read\/\?cid=\d+)"/,
		//
		first_cid = html.between('<div class="section-catalog">').match(
				PATTERN_chapter_url);

		PATTERN_chapter_url
		// [ , url, chapter title, additional information ]
		= / href="(\/read\/\?cid=\d+)"[^<>]*>([^<>]*)<\/a>([\s\S]*?)<\/li>/g;
		work_data.chapter_list = [];
		// 直接取得第一章。章節內容中就有指向所有章節的連結。
		CeL.get_URL(this.base_URL + first_cid[1], function(XMLHttp) {
			var text = XMLHttp.responseText.between(' class="read-section',
					'</ul>'), matched;
			while (matched = PATTERN_chapter_url.exec(text)) {
				// 跳過被鎖住的章節。
				// assert: 應該只在最後的幾個章節。
				if (!matched[3].includes('read-icon-locker')) {
					work_data.chapter_list.push({
						title : get_label(matched[2]),
						url : matched[1]
					});
				}
			}
			callback();

		}, this.charset, null, Object.assign({
			error_retry : this.MAX_ERROR_RETRY
		}, this.get_URL_options));
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		chapter_data.image_list = JSON.parse(
				'[' + html.between(' urls: [', ']').replace(/'/g, '"') + ']')
		//
		.map(function(url) {
			return {
				url : url
			}
		});

		return chapter_data;
	}

});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
