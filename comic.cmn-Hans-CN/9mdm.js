/**
 * 批量下載 9妹漫画网 的工具。 Download 9mdm comics.
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
	base_URL : 'http://www.9mdm.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return [ this.base_URL + 'e/search/index.php', {
			show : 'title,writer',
			tempid : 1,
			tbname : 'sinfo',
			keyboard : work_title
		} ];
	},
	parse_search_result : function(html, get_label) {
		// console.log(html);
		html = html.between('<div class="cy_main">', '</div>');
		var id_list = [], id_data = [];
		html.each_between('<li>', '</li>', function(token) {
			// console.log(token);
			var matched = token.match(
			//
			/<a href="\/manhua\/(\d+)\/"[\s\S]*? alt="([^<>"]+)"/);
			id_list.push(matched[1]);
			id_data.push(get_label(matched[2]));
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'manhua/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			description : get_label(html.between(
					'<div id="comic-description">', '</div>')),
			last_update_chapter : get_label(html.between('<p>最新话：', '</p>'))
		};

		extract_work_data(work_data, html);
		extract_work_data(work_data, html.between('<h1>',
				'<div id="comic-description">'),
				/<span>([^<>：]+)：([\s\S]*?)<\/span>/g);

		Object.assign(work_data, {
			author : work_data.作者,
			status : work_data.状态,
		});

		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between('<div class="cy_plist', '</div>');

		var matched, PATTERN_chapter =
		//
		/<li><a href="([^<>"]+)" title="([^<>"]+)"/g;

		work_data.chapter_list = [];
		while (matched = PATTERN_chapter.exec(html)) {
			var chapter_data = {
				url : matched[1],
				title : get_label(matched[2])
			};
			work_data.chapter_list.push(chapter_data);
		}
		work_data.chapter_list.reverse();
	},

	pre_parse_chapter_data
	// 執行在解析章節資料process_chapter_data()之前的作業(async)。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		//
		url = this.full_URL(chapter_data.url), html = XMLHttp.responseText,
		//
		totalpage = html.between('totalpage =', ';').trim(), _this = this;
		// e.g., http://www.9mdm.com/manhua/4353/141236.html
		totalpage = totalpage === '[!--diypagenum--]' ? 1 : +totalpage;

		if (!(totalpage >= 0)) {
			throw work_data.title + ' #' + chapter_NO + ' '
					+ chapter_data.title + ': Can not get image count!';
		}

		if (work_data.image_list) {
			chapter_data.image_list = work_data.image_list[chapter_NO - 1];
			if (chapter_data.image_list.length === totalpage) {
				CeL.debug(work_data.title + ' #' + chapter_NO + ' '
						+ chapter_data.title + ': Already got ' + totalpage
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
			url = html.between('<div class="mh_list">', '</div>').between(
					' src="', '"');
			CeL.debug('Add image ' + chapter_data.image_list.length + '/'
					+ totalpage + ': ' + url, 2, 'extract_image');
			chapter_data.image_list.push({
				url : url
			});
		}

		chapter_data.image_list = [];
		extract_image(XMLHttp);

		CeL.run_serial(function(run_next, NO, index) {
			var image_page_url = url.replace(/(\.[^.]+)$/, '_' + NO + '$1');
			// console.log('Get ' + image_page_url);
			process.stdout.write('Get image page ' + NO + '/' + totalpage
					+ '...\r');
			CeL.get_URL(image_page_url, function(XMLHttp) {
				extract_image(XMLHttp);
				run_next();
			}, _this.charset, null, Object.assign({
				error_retry : _this.MAX_ERROR_RETRY
			}, _this.get_URL_options));
		}, totalpage, 2, function() {
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
