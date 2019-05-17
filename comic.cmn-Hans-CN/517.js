/**
 * 批量下載 我要去漫画 的工具。 Download 517manhua.com comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.qTcms2017');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2017({
	// one_by_one : true,

	// {Natural|String|Function}當網站不允許太過頻繁的訪問讀取/access時，可以設定下載章節資訊/章節內容前的等待時間。
	// 2019/5/8 5s: OK
	// 2019/5/9 200: OK
	// chapter_time_interval : 100,

	// e.g.,
	// http://pic1.085p.com/upload23/72889/2019/01-13/20190113193831_8982xtnnvyuu_small.jpg
	// {Natural}MIN_LENGTH:最小容許圖案檔案大小 (bytes)。
	MIN_LENGTH : 200,

	base_URL : 'http://www.517manhua.com/'

});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
