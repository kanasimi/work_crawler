/**
 * 批量下載 76漫画 的工具。 Download http://www.srweh.com/ comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.qTcms2017');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2017({
	// 本站採用採集其他網站圖片的方法，錯漏圖片太多。
	skip_error : true,

	// one_by_one : true,

	base_URL : 'http://www.srweh.com/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
