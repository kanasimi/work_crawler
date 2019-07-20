/**
 * 批量下載 漫画看 的工具。 Download MHkan.Com comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.SinMH');

// ----------------------------------------------------------------------------

require('tls').DEFAULT_MIN_VERSION = 'TLSv1';

var crawler = CeL.SinMH({
	// 循序逐個、一個個下載圖像。僅對漫畫有用，對小說無用。小說章節皆為逐個下載。 Download images one by one.
	// 水管太小？總是卡住，下載圖片時常出現 status 522，很難用。
	// one_by_one : true,

	// 當網站不允許太過頻繁的訪問/access時，可以設定下載之前的等待時間(ms)。
	// 模仿實際人工請求。
	// chapter_time_interval : '1s',

	// 2019/6/2: https://www.mhkan.com/
	// 2019/7/8 前: https://www.mh1234.com/
	base_URL : 'https://www.mh1234.com/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
