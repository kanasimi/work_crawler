/**
 * 批量下載 笔趣阁 小说 的工具。 Download xbiquge.so novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.PTCMS');

// ----------------------------------------------------------------------------

var crawler = CeL.PTCMS({
	// 2022/8/16 15:41:36
	base_URL : 'https://www.xbiquge.so/',
	charset : 'gbk',

	// chapter_time_interval : '6s',
	// 两次搜索的间隔时间不得少于 30 秒
	search_work_interval : '30s',

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
		// https://www.xbiquge.so/book/31671/27172195.html
		// 笔趣阁 www.xbiquge.so，最快更新那年那蝉那把剑 ！<br><br>
		/^[\s\n]*笔趣阁.+?最快更新.+?！(?:<br>)+/g, '').replace(
		// 天才壹秒記住『愛♂去÷小?說→網』，為您提供精彩小說閱讀。<br />
		/^[^<>]+提供精彩小說閱讀。<br[^<>]*>/g, '').replace(
		// 天才壹秒記住『愛♂去÷小?說→網』，為您提供精彩小說閱讀。<br />
		/【愛.去.小.說.網[^【】]{5,20}】/g, '');

		/**
		 * <code>

		TODO:

		https://www.ptwxz.com/html/10/10605/8716905.html

		&nbsp;&nbsp;&nbsp;&nbsp;【看书福利】关注公众..号【投资好文】，每天看书抽现金/点币!<br /><br />

		https://www.ptwxz.com/html/10/10605/8700476.html
		https://www.ptwxz.com/html/10/10605/8718557.html

		&nbsp;&nbsp;&nbsp;&nbsp;&emsp;&emsp;【领现金红包】看书即可领现金！关注微信.公众号【书友大本营】，现金/点币等你拿！<br /><br />


		https://www.ptwxz.com/html/10/10605/8721411.html
		&nbsp;&nbsp;&nbsp;&nbsp;&emsp;&emsp;【书友福利】看书即可得现金or点币，还有iPhone12、Switch等你抽！关注vx公众号【书友大本营】可领！<br /><br />

		</code>
		 */

		// console.log(text);
		return text;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
