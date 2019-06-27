/**
 * 批量下載 動漫伊甸園 漫畫 的工具。 Download dmeden.net comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.hhcool');

// ----------------------------------------------------------------------------

CeL.hhcool({

	base_URL : 'http://dmeden.net/',

	base_comic_path : 'comicinfo'

}, function(crawler) {
	start_crawler(crawler, typeof module === 'object' && module);
}, function(crawler) {
	setup_crawler(crawler, typeof module === 'object' && module);
});
