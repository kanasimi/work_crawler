/**
 * 批量下載漫畫櫃繁體的工具。 Download manhuagui comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.manhuagui');

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

// crawler(configuration, callback, initializer)
CeL.manhuagui({

	base_URL : 'https://tw.manhuagui.com/',
	script_base_URL : 'https://cf.hamreus.com/scripts_tw/'

}, function(crawler) {
	start_crawler(crawler, typeof module === 'object' && module);
}, function(crawler) {
	setup_crawler(crawler, typeof module === 'object' && module);
});
