/**
 * 批量下載八八读书网/2017 88读书网的工具。 Download 88dushu novels.
 */

'use strict';

require('./work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.PTCMS');

// ----------------------------------------------------------------------------

var PTCMS = CeL.PTCMS({
	base_URL : 'http://www.88dushu.com/',
	charset : 'gbk',

	// 解析 作品名稱 → 作品id get_work()
	baidu_cse : '2308740887988514756',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'xiaoshuo/' + work_id.slice(0, -3) + '/' + work_id + '/';
	},
	// 取得包含章節列表的文字範圍。
	get_chapter_count_contents : function(html) {
		return html.between('<div class="mulu">', '</div>');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

PTCMS.start(work_id);
