/**
 * 批量下載小説家になろう/ムーンライトノベルズ的工具。 Download syosetu.com novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.yomou');

// ----------------------------------------------------------------------------

var crawler = CeL.yomou({
	site_name : 'ムーンライトノベルズ',
	base_URL : 'https://mnlt.syosetu.com/',
	isR18 : true
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
