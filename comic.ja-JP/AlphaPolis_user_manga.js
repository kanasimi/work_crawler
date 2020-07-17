/**
 * 批量下載アルファポリス - 電網浮遊都市 - Web漫画/無料の投稿漫画 的工具。 Download AlphaPolis user manga.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.AlphaPolis');

// ----------------------------------------------------------------------------

var crawler = CeL.AlphaPolis({
	// 當網站不允許太過頻繁的訪問/access時，可以設定下載之前的等待時間(ms)。
	// 模仿實際人工請求。
	// chapter_time_interval : '5s',

	work_type : 'manga'

});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
