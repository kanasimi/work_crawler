/**
 * 批量下載2016 八一中文网的工具。 Download 81xsw novels.
 */

'use strict';

require('./work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.PTCMS');

// ----------------------------------------------------------------------------

var PTCMS = CeL.PTCMS({
	base_URL : 'http://www.81xsw.com/',
	charset : 'gbk',

	// 解析 作品名稱 → 作品id get_work()
	baidu_cse : '16095493717575840686',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return work_id + '/';
	},
	// 取得包含章節列表的文字範圍。
	get_chapter_count_contents : function(html) {
		return html.between('<div id="list">', '</div>');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

PTCMS.start(work_id);
