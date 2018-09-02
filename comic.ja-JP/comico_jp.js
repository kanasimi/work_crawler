/**
 * 批量下載 comico（コミコ） 的工具。 Download comico comics. (comic.ja-JP)
 * 
 * modify from comico.js
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.comico');

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

CeL.comico({
	base_URL : 'https://www.comico.jp/',

	search_head_token : ' data-result-type="manga">',
	PATTERN_search : /<a href="[^<>"]*?titleNo=(\d+)"[\s\S]*? alt="([^"]+)"/,

	// 取得作品的章節資料。 get_work_data()
	work_URL : 'articleList.nhn?titleNo='

}, function(crawler) {
	start_crawler(crawler, typeof module === 'object' && module);
}, function(crawler) {
	setup_crawler(crawler, typeof module === 'object' && module);
});
