/**
 * 批量下載 花香居 小說 的工具。 Download huaxiangju novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.jieqi_article');

// ----------------------------------------------------------------------------

var crawler = CeL.jieqi_article({

	base_URL : 'https://www.huaxiangju.com/',

	inverted_order : true,

	// 去掉前後網站廣告。
	remove_ads : function(text) {
		text = text.replace(
		// 花香居提供女生言情小说在线阅读，言情小说免费阅读，言情小说TXT下载，言情小说阅读之家。https://www.huaxiangju.com/
		/&#33457;&#39321;&#23621;.+?&#46;&#99;&#111;&#109;&#47;/g, '');

		// e.g., https://www.huaxiangju.com/25087/6323179.html
		text = text.replace(/^(?:热门|熱門|&#160;|&amp;|&nbsp;|<br[^<>]*>|[&:;])+/,
				'');
		if (!text.includes('<div'))
			text = text.replace(/<\/div>/g, '').trim();

		// console.log(text);
		return text;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
