/**
 * 批量下載八八读书网/2017 88读书网的工具。 Download 88dus novels.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.PTCMS');

// ----------------------------------------------------------------------------

var crawler = CeL.PTCMS({
	base_URL : 'https://www.88dus.com/',
	charset : 'gbk',

	// 解析 作品名稱 → 作品id get_work()
	// baidu_cse : '2308740887988514756',
	search_URL : {
		URL : 'search/so.php?search_field=0&q=',
		charset : 'utf8'
	},
	parse_search_result : function(html, get_label) {
		var id_list = [], id_data = [];
		html.each_between('<div class="block_txt">', '</div>', function(text) {
			id_list.push(text.between(' href="/xiaoshuo/', '"').between('/',
					'/'));
			id_data.push(get_label(text.between('<h2>', '</h2>')));
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'xiaoshuo/' + (work_id.slice(0, -3) || 0) + '/' + work_id + '/';
	},
	// 取得包含章節列表的文字範圍。
	get_chapter_list_contents : function(html) {
		return html.between('<div class="mulu">', '</div>');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
