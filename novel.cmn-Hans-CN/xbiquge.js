/**
 * 批量下載 新笔趣阁 小说 的工具。 Download xbiquge novels.
 * 
 * @see x81zw
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.PTCMS');

// ----------------------------------------------------------------------------

var crawler = CeL.PTCMS({
	base_URL : 'https://www.xbiquge6.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search.php?keyword=',
	parse_search_result : function(html, get_label) {
		// console.log(html);

		var id_list = [], id_data = [];
		html.each_between('<div class="result-game-item-detail">',
		//
		'</div>', function(text) {
			var matched = text.match(
			/**
			 * <code>

			<a cpos="title" href="https://www.xbiquge6.com/78_78513/" title="元尊" class="result-game-item-title-link" target="_blank">

			</code>
			 */
			/<a [^<>]*?href="[^<>"]+?\/(?:\d+_)?(\d+)\/"[^<>]*>([\s\S]+?)<\/a>/
			//		
			);
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
		return (work_id / 1000 | 0) + '_' + work_id + '/';
	},
	// 取得包含章節列表的文字範圍。
	get_chapter_list_contents : function(html) {
		return html.between('<div id="list">', '</div>');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
