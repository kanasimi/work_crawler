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

	// 去掉網站廣告。
	remove_ads : function(text) {
		// 去掉前後網站廣告。
		text = text.replace(
		// 花香居提供女生言情小说在线阅读，言情小说免费阅读，言情小说TXT下载，言情小说阅读之家。https://www.huaxiangju.com/
		/&#33457;&#39321;&#23621;.+?&#46;&#99;&#111;&#109;&#47;/g, '');

		text = text.replace(
		// remove 顶点小说ＷｗＷ．ＸＳ⒉②２．ＣＯＭ http://www.xs222.com/
		// 顶.?点.?小.?说
		/[『』]?顶[『』]?点[『』]?小[『』]?说Ｗｗ[『』]?Ｗ．[『』]?Ｘ([『』]|&nbsp;)*Ｓ⒉②２．ＣＯＭ/, '')
		// 被審查而消失、變造的文字
		.replace(/大6/g, '大陆').replace(/\*\*裸/g, '赤裸裸').replace(/\*\*/g, '赤裸裸')
		// 求活的意志
		.replace(/求生\*\*/g, '求生意志');

		text = text
		// e.g., https://www.huaxiangju.com/25087/6323179.html
		.replace(/^(?:热门|&#160;|&amp;|&nbsp;|<br[^<>]*>|[&:;])+/, '');
		if (!text.includes('<div'))
			text = text.replace(/<\/div>/g, '').trim();

		// console.log(text);
		return text;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
