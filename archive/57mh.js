/**
 * 批量下載 57漫画网 的工具。 Download 57mh comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.SinMH2013');

// ----------------------------------------------------------------------------

var crawler = CeL.SinMH2013({
	// 早於2017/11-2019/1底換域名: http://www.57mh.com/
	// 2019/2/15 19:56 最後一次成功連接 http://www.5qmh.com/
	// 2019/3/1 改 http://www.wuqimh.com/
	// 2023/1/30 前改 https://www.wuqimh.net/ 圖片多無法讀取
	base_URL : 'https://www.wuqimh.net/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
