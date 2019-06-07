/**
 * 批量下載 comico（コミコ） オトナ限定 的工具。 Download comico adult comics. (comic.ja-JP)
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
	base_URL : 'https://plus.comico.jp/',

	// 每個項目的<li>開頭。
	search_head_token : ' data-result-type="official">',
	PATTERN_search : /<a href="[^<>"]*?titleNo=(\d+)"[\s\S]*? alt="([^"]+)"/,

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'manga/' + work_id + '/';
	},

	consume_url : 'manga/consume/index.nhn'

}, function(crawler) {
	start_crawler(crawler, typeof module === 'object' && module);
}, function(crawler) {
	setup_crawler(crawler, typeof module === 'object' && module);
});
