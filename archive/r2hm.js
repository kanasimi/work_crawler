/**
 * 批量下載 无双漫画 的工具。 Download r2hm comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.dm5');

// ----------------------------------------------------------------------------

var crawler = CeL.dm5({
	// MIN_LENGTH : 600,

	base_URL : 'https://r2hm.com/',

	// 解析 作品名稱 → 作品id get_work()
	// <a id="btnSearch" href="javascript:;">搜索</a>
	search_URL : 'search?keyword=',

	work_URL : 'book/',

	inverted_order : false,

	pre_parse_chapter_data : null
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
