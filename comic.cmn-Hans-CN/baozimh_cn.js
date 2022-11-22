/**
 * 批量下載包子漫畫的工具。 Download baozimh comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.baozimh');

// ----------------------------------------------------------------------------

var crawler = new CeL.baozimh({
	// https://cn.baozimh.com/ , https://cn.webmota.com/
	// 2022/11/19 已採用 Cloudflare 的阻斷服務攻擊保護。
	base_URL : 'https://cn.baozimh.com/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
