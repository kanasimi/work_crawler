/**
 * 批量下載 韩漫窝 漫画 的工具。 Download hanmanwo comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.dm5');

// ----------------------------------------------------------------------------

var crawler = CeL.dm5({
	// MIN_LENGTH : 400,
	skip_error : true,

	base_URL : 'http://www.hanmanwo.com/',

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
