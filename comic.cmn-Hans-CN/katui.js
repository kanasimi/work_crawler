/**
 * 批量下載 卡推漫画 的工具。 Download katui comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.qTcms2014');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2014({
	// e.g., 蓝翅 http://www.700mh.com/manhua/736/
	acceptable_types : 'webp',

	// 2019/6: 改 http://www.katui.net/
	base_URL : 'http://www.700mh.com/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
