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
	// MIN_LENGTH : 400,

	base_URL : 'https://mymhh.com/',

	// 解析 作品名稱 → 作品id get_work()
	// <a id="btnSearch">搜索</a>
	search_URL : 'search?keyword=',

	work_URL : 'book/',

	inverted_order : false,

	pre_parse_chapter_data : null
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
