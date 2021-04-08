/**
 * 批量下載 笔趣阁 小说 的工具。 Download xbiquge novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.PTCMS');

// ----------------------------------------------------------------------------

var crawler = CeL.PTCMS({
	base_URL : 'https://www.xbiquge.cc/',
	charset : 'gbk',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'modules/article/search.php?searchkey=',
	parse_search_result : 'biquge',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'book/' + work_id + '/';
	},
	// 取得包含章節列表的文字範圍。
	get_chapter_list_contents : function(html) {
		return html.between('<div id="list">', '</div>');
	},
	// 去掉前後網站廣告。
	remove_ads : function(text) {
		// 去掉前後網站廣告。
		text = text.replace(
		// 笔趣阁 www.xbiquge.cc，最快更新不朽凡人最新章节！<br><br>
		// 笔趣阁 www.xbiquge.cc，最快更新凡人修仙传 ！<br><br>
		/^[\s\n]*笔趣阁.+?最快更新.+?！(?:<br>)+/g, '').replace(
		// 天才壹秒記住『愛♂去÷小?說→網』，為您提供精彩小說閱讀。<br />
		/^[^<>]+提供精彩小說閱讀。<br[^<>]*>/g, '').replace(
		// 天才壹秒記住『愛♂去÷小?說→網』，為您提供精彩小說閱讀。<br />
		/【愛.去.小.說.網[^【】]{5,20}】/g, '');

		// console.log(text);
		return text;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
