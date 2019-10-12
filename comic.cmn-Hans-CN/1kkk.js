/**
 * 批量下載 极速漫画 漫画人 的工具。 Download 1kkk comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.dm5');

// ----------------------------------------------------------------------------

var crawler = CeL.dm5({
	base_URL : 'http://www.1kkk.com/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
