/**
 * 批量下載 我要去漫画 的工具。 Download 517manhua.com comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.qTcms2017');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2017({
	one_by_one : true,
	// 當網站不允許太過頻繁的訪問/access時，可以設定下載之前的等待時間(ms)。
	chapter_time_interval : '10s',

	base_URL : 'http://www.517manhua.com/'

});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
