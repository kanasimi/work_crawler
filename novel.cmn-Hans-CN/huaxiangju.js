/**
 * 批量下載 花香居 小說 的工具。 Download huaxiangju novels.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.jieqi_article');

// ----------------------------------------------------------------------------

var crawler = CeL.jieqi_article({

	base_URL : 'https://www.huaxiangju.com/',

	inverted_order : true,

	// 去掉前後網站廣告。
	remove_ads : function(text) {
		return text.replace(
		// 花香居提供女生言情小说在线阅读，言情小说免费阅读，言情小说TXT下载，言情小说阅读之家。https://www.huaxiangju.com/
		/&#33457;&#39321;&#23621;.+?&#46;&#99;&#111;&#109;&#47;/g, '');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
