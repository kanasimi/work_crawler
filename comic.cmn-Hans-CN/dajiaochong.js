/**
 * 批量下載 大角虫漫画_超有爱的日更原创国漫平台 的工具。 Download dajiaochongmanhua comics.
 * 
 * @since 2018/3/17 8:7:55
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

// e.g., <div class="book-info"> <span class="info-attr">状态</span>
// <p class="info-text">一周三更</p> </div>
var PATTERN_work_data = /<span class="info-attr"[^<>]*>([^<>]+)<\/span>[\s\n]*<p class="info-text">([^<>]+)<\/p>/g,
//
crawler = new CeL.work_crawler({
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// one_by_one : true,
	base_URL : 'https://www.dajiaochongmanhua.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search/?str=',
	parse_search_result : function(html, get_label) {
		var id_list = [], id_data = [];
		html.each_between('<li class="sh-rt-list">', '</li>',
		/**
		 * e.g., <code>
		<a href="/comic/248" target="_blank" search="title"> <i class="sh-rt-bn text-ignore">我的男神</i> </a>
		</code>
		 */
		function(text) {
			var matched = text
					.match(/<a href="\/comic\/(\d+)"[^<>]*?>([\s\S]+?)<\/a>/);
			id_list.push(+matched[1]);
			id_data.push(get_label(matched[2]));
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'detail/?bookid=' + work_id;
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var data = html.between('<div class="wrapper detail-main">',
				'<div class="book-chapter'),
		//
		work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(data.between('<h3 class="book-name">', '</h3>')),

			// 選擇性屬性：須配合網站平台更改。
			last_update : html.between('<p class="chapter-date">', '</p>')
					.replace(/ *更新/, ''),
			星星 : data.between('<p class="star-number">', '</p>')
		};
		extract_work_data(work_data, html);
		extract_work_data(work_data, data, PATTERN_work_data);

		Object.assign(work_data, {
			status : work_data.状态,
		// description : work_data.介绍,
		// last_update : work_data.上次更新
		});

		return work_data;
	},
	// pre_get_chapter_list_via_api
	pre_get_chapter_list : function(callback, work_data, html) {
		if (html.startsWith('获取数据失败')) {
			CeL.error(this.id + ': ' + (work_data.title || work_data.id) + ': '
			// e.g., 三层世界
			+ '作品不存在/已被刪除');
			// delete old cache
			// delete work_data.chapter_list;
			callback();
			return;
		}

		// 用這個方法獲得的資訊比較完整。但是必須取得多個檔案。
		var _this = this, last_list_NO = html.between(
				'<ul class="chapter-select"', '</ul>').match(
				/<li index="(\d+)"[^<>]*?>[^<>]+?<\/li>[^<>]*?$/);
		last_list_NO = last_list_NO ? +last_list_NO[1] : 1;

		work_data.chapter_list = [];

		CeL.run_serial(function(run_next, item, index, list) {
			CeL.get_URL(_this.base_URL + 'chaptshow?bookid=' + work_data.id
					+ '&start=' + item + '&view_type=0&_=' + Date.now(),
			//
			function(XMLHttp) {
				var chapter_list_token = JSON.parse(XMLHttp.responseText);
				work_data.chapter_list.append(chapter_list_token.data.data);
				run_next();

			}, _this.charset, null, Object.assign({
				error_retry : _this.MAX_ERROR_RETRY
			}, _this.get_URL_options));

		}, last_list_NO, 1, function() {
			work_data.chapter_list.forEach(function(chapter_data) {
				chapter_data.url = 'chapter/' + chapter_data.cid;
				chapter_data.title = chapter_data.name;
			});
			callback();
		});
	},
	pre_get_chapter_list_201804 :
	// 20180522 改版失效
	function(callback, work_data, html, get_label) {
		if (html.startsWith('{"error":')) {
			html = JSON.parse(html);
			CeL.error(this.id + ': ' + (work_data.title || work_data.id) + ': '
			// e.g., 三层世界
			+ (html.error === 5 ? '作品不存在/已被刪除' : html.messages || 'error'));
			callback();
			return;
		}

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
		try {
			chapter_data.image_list = JSON.parse(html.between(
					'var IMAGE_LIST_URL =', ';').replace(/'/g, '"'));
		} catch (e) {
			CeL.error(html.length < 200 ? html : e);
			return;
		}

		return chapter_data;
	}

});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
