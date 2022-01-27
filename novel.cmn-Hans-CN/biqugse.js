/**
 * 批量下載 笔趣阁 小说 的工具。 Download biqugse novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.PTCMS');

// ----------------------------------------------------------------------------

var crawler = CeL.PTCMS({
	base_URL : 'http://www.biqugse.com/',
	must_browse_first : true,

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(key) {
		return [ 'case.php?m=search', {
			key : key
		} ];
	},
	parse_search_result : function(html, get_label) {
		// console.log(html);
		html = html.between('<div id="newscontent">', '</ul>');
		// console.log(html);

		var id_list = [], id_data = [];
		html.each_between('<li>', '</li>', function(text) {
			var matched = text.match(
			/**
			 * <code>

			// biqugse.js
			<li><span class="s1">[武侠修真]</span>
			<span class="s2"><a href="/507/" target="_blank">走进修仙</a></span>
			<span class="s3"><a href="/507/34139004.html" target="_blank">后日谈二、三则</a></span>
			<span  class="s4">吾道长不孤</span>
			<span class="s5">12-01</span>
			</li>

			</code>
			 */
			/<a href="[^<>"]*\/(?:\d+_)?(\d+)\/"[^<>]*>([\s\S]+?)<\/a>/);
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
		return '/' + work_id + '/';
	},
	// 取得包含章節列表的文字範圍。
	get_chapter_list_contents : function(html) {
		return html.between('<div id="list">', '</div>');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
