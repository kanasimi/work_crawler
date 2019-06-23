/**
 * 批量下載小説家になろう/ムーンライトノベルズ的工具。 Download syosetu.com novels.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.yomou');

// ----------------------------------------------------------------------------

var crawler = CeL.yomou({
	site_name : 'ムーンライトノベルズ',
	base_URL : 'https://mnlt.syosetu.com/',
	novel_base_URL : 'https://novel18.syosetu.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search/search/?word=',
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
