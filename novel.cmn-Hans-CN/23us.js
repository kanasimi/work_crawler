/**
 * 批量下載2016 顶点小说(http://www.23us.cc)的工具。 Download 23us novels.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.PTCMS');

// ----------------------------------------------------------------------------

var PTCMS = CeL.PTCMS({
	// 23us 在連續下載2000章左右後似乎會自動404，得要等如3分鐘才會回復。
	// 明確指定自上次下載過的章節接續下載。
	// recheck : false,

	base_URL : 'http://www.23us.cc/',

	// 解析 作品名稱 → 作品id get_work()
	baidu_cse : '1682272515249779940',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'html/' + (work_id.slice(0, -3) || 0) + '/' + work_id + '/';
	},
	// 取得包含章節列表的文字範圍。
	get_chapter_count_contents : function(html) {
		return html.between('<dl class="chapterlist">', '</dl>');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

PTCMS.start(work_id);
