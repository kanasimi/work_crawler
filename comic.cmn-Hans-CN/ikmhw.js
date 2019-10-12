/**
 * 批量下載 爱看漫画网 的工具。 Download ikmhw comics.
 * 
 * TODO: http://m.ikmhw.com/
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.dm5');

// ----------------------------------------------------------------------------

var crawler = CeL.dm5({
	// e.g., 809 临界暧昧\0017 第17话（48P）\809-17-039 bad.jpg
	MIN_LENGTH : 600,
	skip_error : true,

	base_URL : 'http://ikmhw.com/',

	// 解析 作品名稱 → 作品id get_work()
	// <a id="btnSearch" href="javascript:void(0);"
	// onclick="mhsearch('/e/search/')">搜索</a>
	search_URL : 'e/search/?searchget=1&show=title,author&keyboard=',

	parallel_limit : 50,
	image_API : 'e/extend/read/index.php?did='
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
