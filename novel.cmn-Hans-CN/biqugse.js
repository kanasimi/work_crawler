/**
 * 批量下載 笔趣阁 小说 的工具。 Download biqugse novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.PTCMS');

// ----------------------------------------------------------------------------

var PATTERN_pages = /(?:<br\s*\/?>)*(?:&nbsp;)*(?:（本章未完，请点击下一页继续阅读）)?最新网址：(?:<br\s*\/?>)*(?:&nbsp;)*第[^<>()]+?章 [^<>()]+? \(第\d\/\d页\)(?:<br\s*\/?>)+/g;

var crawler = CeL.PTCMS({
	base_URL : 'http://www.biqugse.com/',
	must_browse_first : true,

	chapter_time_interval : 200,

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
	},

	remove_ads : function(text, chapter_data) {
		text = text

		/**
		 * <code>

		// http://www.biqugse.com/107322/103843803.html	长生，从养鸡杂役开始 >第79章博弈
		<br/>最新网址：&nbsp;&nbsp;&nbsp;&nbsp;第七十九章 博弈 (第1/3页)<br/>
		<br/>&nbsp;&nbsp;&nbsp;&nbsp;（本章未完，请点击下一页继续阅读）最新网址：<br/>&nbsp;&nbsp;&nbsp;&nbsp;第七十九章 博弈 (第2/3页)<br/>

		</code>
		 */
		.replace(PATTERN_pages, '')

		;

		return text;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
