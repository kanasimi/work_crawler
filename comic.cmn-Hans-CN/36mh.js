/**
 * 批量下載 36漫画网 的工具。 Download 36mh comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.SinMH');

// ----------------------------------------------------------------------------

var crawler = CeL.SinMH({
	// 36mh\quanzhifashi 全职法师\0338 326 山道惊魂\quanzhifashi-338-015.jpg
	skip_error : true,

	base_URL : 'https://www.36mh.com/',

	chapter_inverted_order : true
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
