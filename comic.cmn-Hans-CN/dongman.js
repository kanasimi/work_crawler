/**
 * 批量下載 咚漫中文官网 韓國漫畫 的工具。 Download dongmanmanhua comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.webtoon');

// ----------------------------------------------------------------------------

var crawler = CeL.webtoon({
	// https://www.webtoons.com/zh-hans/
	base_URL : 'https://www.dongmanmanhua.cn/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search/autoComplete?keyword='
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
