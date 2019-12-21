/**
 * 批量下載 2013 新八一中文网的工具。 Download x81zw novels.
 * 
 * @see xbiquge
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.PTCMS');

// ----------------------------------------------------------------------------

/**
 * <code>
 <h3 class="result-item-title result-game-item-title">
 <a cpos="title" href="/book/4/4235/" title="诡秘之主" class="result-game-item-title-link" target="_blank">
 诡秘之主
 </a >
 </h3 >
 </code>
 */
// [ all, id, title, title ]
var PATTERN_search_anchor = /<a [^<>]*?href="[^<>"]+?\/(\d+)\/?"[^<>]+?title="([^<>"]+)"[^<>]*?>([\s\S]+?)<\/a>/,
//
crawler = CeL.PTCMS({
	base_URL : 'https://www.x81zw.com/',

	// 提取出引數（如 URL）中的作品ID 以回傳。
	extract_work_id : function(work_information) {
		return /^[\d_]+$/.test(work_information) && work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search.php?keyword=',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [];

		html.each_between(' class="result-item-title', '</h3>', function(text) {
			// console.log(text);
			var matched = text.match(PATTERN_search_anchor);
			id_list.push(+matched[1]);
			id_data.push(get_label(matched[2]));
		});

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'book/' + (work_id / 1000 | 0) + '/' + work_id;
	},
	// 取得包含章節列表的文字範圍。
	get_chapter_list_contents : function(html) {
		return html.between('<div id="list">', '</div>');
	},
	pre_add_ebook_chapter : function(data) {
		// console.log(data.text);
		data.text = data.text.replace(/([\s\S]+?)<首发[\s\S]+?(?:<br>|$)/g, function(all, front) {
			var index = front.lastIndexOf('<br>');
			if (index >= 0)
				front = front.slice(0, index);
			return front;
		});
		// console.log(data.text);
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
