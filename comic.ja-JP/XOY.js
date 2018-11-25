/**
 * 批量下載 XOY（ジョイ） 漫畫 的工具。 Download XOY comics. (comic.ja-JP)
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.webtoon');

// ----------------------------------------------------------------------------

var crawler = CeL.webtoon({
	base_URL : 'https://xoy.webtoons.com/',
	language_code : 'ja'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
