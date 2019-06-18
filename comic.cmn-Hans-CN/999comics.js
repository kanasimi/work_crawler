/**
 * 批量下載 99漫畫網 的工具。 Download 999comics comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.SinMH2013');

// ----------------------------------------------------------------------------

var crawler = CeL.SinMH2013({
	// one_by_one : true,

	base_URL : 'https://www.999comics.com/',
	no_need_to_revert : true,

	// 取得伺服器列表。
	// use_server_cache : true,
	server_URL : function() {
		// https://www.999comics.com/static/scripts/configs.js?v=8
		return this.base_URL + 'static/scripts/configs.js';
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		// CeL.set_debug(9);
		return 'word/?cb=_&key=' + escape(work_title);

		// NG:
		return [ 'word/', {
			cb : 'jQuery'
			// @see .expando
			+ ('1.8.3' + Math.random()).replace(/\D/g, "") + '_' + Date.now(),
			key : escape(work_title),
			_ : Date.now()
		} ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		// e.g., https://www.999comics.com/comic/33485/
		return 'comic/' + work_id + '/';
	},

	image_preprocessor : function(contents, image_data) {
		var index = contents.length - 2;
		if (contents[index] === 0x0D && contents[index + 1] === 0x0A) {
			// 去掉最後的換行符號：有些圖片會被加上換行符號 "\r\n"。
			// r.g., 34444 異世界精靈的奴隸醬, 33485 會歪掉的啊
			return contents.slice(0, -2);
		}
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
