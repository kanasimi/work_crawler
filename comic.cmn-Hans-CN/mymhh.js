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
	// 2020/3/26: Also https://www.mymhh.com/
	// 2022/11/4前: 404 https://www.mymhh.com/
	base_URL : 'https://www.17te.com/',
	// 2020/1: 僅能以手機觀看。
	user_agent : 'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X)'
			+ ' AppleWebKit/604.1.34 (KHTML, like Gecko)'
			+ ' Version/11.0 Mobile/15A5341f Safari/604.1',

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
