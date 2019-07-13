/**
 * 批量下載 动漫屋网/漫画人 的工具。 Download dm5.com comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.dm5');

// ----------------------------------------------------------------------------

var crawler = CeL.dm5({
	one_by_one : true,
	base_URL : 'https://www.dm5.com/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
