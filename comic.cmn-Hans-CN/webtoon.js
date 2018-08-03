/**
 * 批量下載 WEBTOON 中文官網 韓國漫畫 的工具。 Download NAVER WEBTOON comics.
 * (comic.cmn-Hant-TW)
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.webtoon');

// ----------------------------------------------------------------------------

var crawler = CeL.webtoon({
	// https://www.webtoons.com/zh-hant/
	language_code : 'zh-hant'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
