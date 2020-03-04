/**
 * 批量下載 梦游漫画 的工具。 Download mymhh comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.dm5');

// ----------------------------------------------------------------------------

var crawler = CeL.dm5({
	// 本網站偶爾有圖片不存在的現象。
	skip_error : true,
	MIN_LENGTH : 400,

	// 2020/1: https://mymhh.com/
	// 2020/2: https://www.mumumh.com/
	base_URL : 'https://www.mumumh.com/',
	// 僅能以手機觀看。
	user_agent : 'Mozilla/5.0 (Linux; Android 10; Pixel 4)'
			+ ' AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.'
			+ (Math.random() * 1e4).toFixed(1) + ' Mobile Safari/537.36',

	// 解析 作品名稱 → 作品id get_work()
	// <a id="btnSearch">搜索</a>
	search_URL : 'search?keyword=',

	work_URL : function(id) {
		return 'book/' + id;
	},

	inverted_order : false,

	pre_parse_chapter_data : null
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
