/**
 * 批量下載 土豪漫画 的工具。 Download tohomh comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.dm5');

// ----------------------------------------------------------------------------

var crawler = CeL.dm5({
	// 2019/1/21 土豪漫畫網址更動 ← https://www.tohomh.com/
	base_URL : 'https://www.tohomh123.com/',

	// 解析 作品名稱 → 作品id get_work()
	// <a id="btnSearch" href="javascript:void(0);"
	// onclick="mhsearch('/action/Search')">搜索</a>
	search_URL : 'action/Search?keyword=',

	image_API : 'action/play/read?did='
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
