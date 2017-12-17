/**
 * 批量下載小説家になろう/ノクターンノベルズ的工具。 Download syosetu.com novels.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.yomou');

// ----------------------------------------------------------------------------

var crawler = CeL.yomou({
	site_name : 'ノクターンノベルズ',
	base_URL : 'http://noc.syosetu.com/',
	novel_base_URL : 'http://novel18.syosetu.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search/search/search.php?order=hyoka&word=',
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

// for 年齢確認
crawler.get_URL_options.cookie = 'over18=yes';
start_crawler(crawler, typeof module === 'object' && module);
