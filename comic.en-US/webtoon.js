/**
 * 批量下載 LINE WEBTOON 漫畫 的工具。 Download NAVER WEBTOON comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.webtoon');

// ----------------------------------------------------------------------------

var crawler = CeL.webtoon({
	language_code : 'en'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
