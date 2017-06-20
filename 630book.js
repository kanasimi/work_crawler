/**
 * 批量下載2017 恋上你看书网的工具。 Download 630book novels. 本站在流量大的時候，似乎會限制讀取速率。
 */

'use strict';

require('./work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.PTCMS');

// ----------------------------------------------------------------------------

var PTCMS = CeL.PTCMS({
	base_URL : 'http://www.630book.la/',
	charset : 'gbk',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'modules/article/search.php?'
			+ 'searchtype=articlename&searchkey=',
	parse_search_result : function(html, get_label) {
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [], get_next_between = html.find_between(
				'<td class="odd" align="center"><a href="/shu/', '</a>'), text;

		while ((text = get_next_between()) !== undefined) {
			var matched = text.between(null, '"').match(/([\d_]+)\.html$/);
			id_list.push(matched[1]);
			matched = text.between('>');
			id_data.push(get_label(matched));
		}

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return '/shu/' + work_id + '.html';
	},
	// 取得包含章節列表的文字範圍。
	get_chapter_count_contents : function(html) {
		return html.between('<dl class="zjlist">', '</dl>');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

PTCMS.start(work_id);
