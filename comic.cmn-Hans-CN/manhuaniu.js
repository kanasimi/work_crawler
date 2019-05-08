/**
 * 批量下載 漫画牛 的工具。 Download manhuaniu comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.SinMH');

// ----------------------------------------------------------------------------

var crawler = CeL.SinMH({
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。
	// 有些漫畫作品分區分單行本、章節與外傳，當章節數量改變、添加新章節時就需要重新檢查。
	// recheck : 'changed',

	base_URL : 'https://www.manhuaniu.com/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
