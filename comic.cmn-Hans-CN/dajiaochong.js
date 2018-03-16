/**
 * 批量下載 大角虫漫画_超有爱的日更原创国漫平台 的工具。 Download dajiaochong comics.
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
	pre_get_chapter_list : function(work_data, html, callback) {
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

		}, last_list_NO, 1, callback);
	},
	get_chapter_list : function(work_data, html) {
		work_data.chapter_list.forEach(function(chapter_data) {
			chapter_data.url = 'read/?cid=' + chapter_data.cid;
		});
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		console.log(html)
		throw 45456456

		return chapter_data;
	}

});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
