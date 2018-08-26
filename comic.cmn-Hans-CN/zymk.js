/**
 * 批量下載 小明太极（湖北）国漫文化有限公司 知音漫客网 漫畫 的工具。 Download zymk comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// {Natural}最小容許圖案檔案大小 (bytes)。
	// MIN_LENGTH : 500,

	// one_by_one : true,
	base_URL : 'https://www.zymk.cn/',

	// 取得伺服器列表。
	use_server_cache : true,
	server_URL : 'https://server.zymkcdn.com/mhpic.asp'
			+ '?callback=__cr.setLine&_=' + Date.now(),
	parse_server_list : function(html) {
		var server_list = JSON.parse(html.between('setLine(', ')'));
		return server_list.data.map(function(server_data) {
			// @see e.prototype.getPicUrl
			return 'https://' + server_data.domain + '/comic/';
		});
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return 'api/getsortlist/?callback=getsortlistCb&key='
				+ encodeURIComponent(work_title.replace(/\s+\d+$/, ''))
				+ '&topnum=20&client=pc';
	},
	parse_search_result : function(html, get_label) {
		html = JSON.parse(html.between('getsortlistCb(', ')')).data;
		return [ html, html ];
	},
	id_of_search_result : 'comic_id',
	title_of_search_result : 'comic_name',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
		// 必要屬性：須配合網站平台更改。

		// 選擇性屬性：須配合網站平台更改。
		};

		extract_work_data(work_data, html);

		Object.assign(work_data, {
			description : get_label(html.between('<div class="desc-con">',
					'</div>')),
			last_update : work_data.update_time
		});

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between(' id="chapterList">', '</ul>');

		var matched, PATTERN_chapter =
		/**
		 * <code>
		<li class="item newest" data-id="130097"><a href="130097.html" title="134话">134话</a><i class="ift-new"></i> <i class="ift-lock"></i></li>
		</code>
		 */
		/<li[^<>]*><a href="([^<>"]+)"[^<>]* title="([^<>"]+)">/g;

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

	chapter_URL : function(work_data, chapter_NO) {
		return this.work_URL(work_data.id)
				+ work_data.chapter_list[chapter_NO - 1].url;
	},
	parse_chapter_data : function(html, work_data) {
		var chapter_data;
		html = html.between('__cr.init(', '</script>').between(null, {
			tail : ')'
		});
		eval('chapter_data=' + html);
		if (!chapter_data) {
			CeL.log('無法解析資料！');
			return;
		}
		chapter_data.imgpath = chapter_data.chapter_addr
		// https://www.zymk.cn/static/js/default/entry.read.a8c614.js
		// @see e.prototype.charcode
		.replace(/./g, function(a) {
			return String.fromCharCode(a.charCodeAt(0)
					- chapter_data.chapter_id % 10);
		});
		delete chapter_data.chapter_addr;
		if (!(chapter_data.end_var > chapter_data.start_var)) {
			// @see e.prototype.setInitData
			chapter_data.end_var = chapter_data.start_var;
		}
		// console.log(JSON.stringify(chapter_data));

		var postfix = (chapter_data.image_type || ".jpg")
				+ (chapter_data.comic_definition.high
						|| chapter_data.comic_definition.middle || "");
		chapter_data.image_list = [];
		for (var index = chapter_data.start_var;
		// @see e.prototype.getPicUrl
		index <= chapter_data.end_var; index++) {
			chapter_data.image_list.push({
				url : chapter_data.imgpath + index + postfix
			});
		}
		// console.log(JSON.stringify(chapter_data));

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
