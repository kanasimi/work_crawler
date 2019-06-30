/**
 * 批量下載 塔多漫画网 的工具。 Download taduo comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.qTcms2014');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2014({
	base_URL : 'http://www.taduo.net/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
