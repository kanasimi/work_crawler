/**
 * 批量下載 卡推漫画 的工具。 Download katui comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.qTcms2014');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2014({
	base_URL : 'http://www.katui.net/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
