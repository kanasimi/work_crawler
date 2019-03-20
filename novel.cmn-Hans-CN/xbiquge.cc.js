/**
 * 批量下載 笔趣阁 小说 的工具。 Download xbiquge novels.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.PTCMS');

// ----------------------------------------------------------------------------

var crawler = CeL.PTCMS({
	base_URL : 'http://www.xbiquge.cc/',
	charset : 'gbk',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'modules/article/search.php?searchkey=',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		var matched = html
				.match(/og:url" content="[^<>"]+?\/(?:\d+_)?(\d+)\/"/);
		if (matched) {
			return [ [ +matched[1] ],
					[ get_label(html.between('og:title" content="', '"')) ] ];
		}

		var id_list = [], id_data = [];
		html.each_between('<li>', '</li>', function(text) {
			matched = text.match(
			/**
			 * <code>

			// biquge.js:
			<span class="s2"><a href="https://www.xs.la/211_211278/" target="_blank">
			万古剑神</a>
			</span>

			// xbiquge.js:
			<span class="s2"><a href="http://www.xbiquge.cc/book/24276/">元尊</a></span>

			</code>
			 */
			/<a href="[^<>"]+?\/(?:\d+_)?(\d+)\/"[^<>]*>([\s\S]+?)<\/a>/);
			// console.log([ text, matched ]);
			if (matched) {
				id_list.push(+matched[1]);
				id_data.push(get_label(matched[2]));
			}
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'book/' + work_id + '/';
	},
	// 取得包含章節列表的文字範圍。
	get_chapter_list_contents : function(html) {
		return html.between('<div id="list">', '</div>');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
