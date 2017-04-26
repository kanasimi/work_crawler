/**
 * 批量下載小説家になろう/ノクターンノベルズ的工具。 Download syosetu.com novels.
 */

'use strict';

require('./work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.yomou');

// ----------------------------------------------------------------------------

var syosetu = CeL.yomou({
	site_name : 'ノクターンノベルズ',
	base_URL : 'http://noc.syosetu.com/',
	novel_base_URL : 'http://novel18.syosetu.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search/search/search.php?order=hyoka&word=',
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

// for 年齢確認
syosetu.get_URL_options.agent.last_cookie = 'over18=yes';
syosetu.start(work_id);
