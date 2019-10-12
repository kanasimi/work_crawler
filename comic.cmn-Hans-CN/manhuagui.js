/**
 * 批量下載漫画柜的工具。 Download manhuagui comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.manhuagui');

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

// crawler(configuration, callback, initializer)
CeL.manhuagui({

}, function(crawler) {
	start_crawler(crawler, typeof module === 'object' && module);
}, function(crawler) {
	setup_crawler(crawler, typeof module === 'object' && module);
});
