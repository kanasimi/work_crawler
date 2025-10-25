/**
 * 批量下載 奇漫屋 的工具。 Download qiman5 comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

// https://stackoverflow.com/questions/31673587/error-unable-to-verify-the-first-certificate-in-nodejs
// fix Error: unable to verify the first certificate
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

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
	// 2025/10/25 8:14:54 lost. → https://qimanwu.org/ ?
	// 之後更改域名
	base_URL : 'http://www.qiman6.com/',

	search_URL : 'search.php?keyword=',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		var id_list = [], id_data = [];

		/**
		 * <code>

		<div class="item ib" >
			<a href="/23883/">
			<div class="book">
				<img class="cover" src="https://p.pstatp.com/origin/fed1000268b0116e0b1f" alt="超神机械师" title="超神机械师"><a href="/23883/"><span class="msg op">61 力场类异能</span></a>
			</div>
			</a>
			<p class="title">
				<a href="/23883/" title="超神机械师">超神机械师</a>
			</p>
			<p class="tip">
				<a href="/23883/">阅文漫画</a>
			</p>
		</div>

		</code>
		 */
		html.each_between('<p class="title"', '</p>', function(text) {
			// console.log(text);
			var matched = text.match(/href="\/(\d+)\/" title="([^"]+?)"/);
			id_list.push(matched[1]);
			id_data.push(matched[2]);
		});

		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// console.log(html);
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1', '</h1>').between('>')),

			// 選擇性屬性：須配合網站平台更改。
			description : get_label(html.between(
			//
			'<p class="content">', '</p>'))
		};
		// 由 meta data 取得作品資訊。
		extract_work_data(work_data, html);
		extract_work_data(work_data, html.between('<div class="ib info">',
		// <div class="chapterList" id="chapterList">
		' id="chapterList"'), / class="ib[^<>]+>([^:：]+)：([^<>]+)<\/span>/g);

		Object.assign(work_data, {
			last_update : work_data.date,
			status : work_data['状  态'],

			chapter_list : []
		});

		// <div class="list" id="chapter-list1">
		html.between(' id="chapter-list1"', '</div>')
		// <a href="/23883/1282722.html" class="ib">61 力场类异能</a>
		.each_between('<a href="', '</a>', function(text) {
			work_data.chapter_list.push({
				url : text.between(null, '"'),
				title : get_label(text.between('>'))
			});
		});

		return work_data;
	},

	chapter_list_URL : function(work_id, work_data) {
		return [ 'bookchapter/', {
			id : work_id,
			id2 : 1
		} ];
	},
	get_chapter_list : function(work_data, html, get_label) {
		var remaind_chapter_list = JSON.parse(html);
		work_data.chapter_list.append(remaind_chapter_list);
		remaind_chapter_list.forEach(function(chapter_data) {
			// { chapterid: '1271595', chaptername: '42 分头行动' }
			Object.assign(chapter_data, {
				url : '/' + work_data.id + '/' + chapter_data.chapterid
						+ '.html',
				title : chapter_data.chaptername
			});
		});
		work_data.inverted_order = true;
		// console.trace([ work_data.chapter_list, remaind_chapter_list ]);
		// console.log(work_data);
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);
		// console.log(work_data.chapter_list);
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		// console.log(chapter_data);

		html.each_between('<script type="text/javascript">', '</script>',
		//
		function(text) {
			// var
			// newImgs=["https://p.pstatp.com/origin/pgc-image/56dae64dc3cb4d6c92791f78927bd0e9...
			if (/^\s*eval\(function\(/.test(text)) {
				chapter_data.image_list = JSON.parse(
						eval(text.between('eval')).replace(/^\s*var\s+\w+\s*=/,
								'')).map(function(url) {
					return {
						url : url,
						// 2022/10/17: 設了 Referer 會403 Forbidden
						get_URL_options : {
							headers : {
								Referer : undefined
							}
						}
					};
				});
			}
		});
		// console.log(chapter_data.image_list);
		// console.log(JSON.stringify(chapter_data));
		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
