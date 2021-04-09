/**
 * 批量下載 漫画DB 的工具。 Download manhuadb comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.manhuadb');

// ----------------------------------------------------------------------------

var crawler = new CeL.manhuadb({
	// 2018/8: http://www.manhuadb.com/
	// 2020/4/11: https://www.manhuadb.com/
	base_URL : 'https://www.manhuadb.com/'

});

// ----------------------------------------------------------------------------

start_crawler(crawler, typeof module === 'object' && module);
