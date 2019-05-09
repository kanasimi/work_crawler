/**
 * 批量下載2016 八一中文网的工具。 Download 81xsw novels.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.PTCMS');

// ----------------------------------------------------------------------------

var crawler = CeL.PTCMS({
	// 最後一次成功下載此網站作品日期: 2019/1/12。
	base_URL : 'http://www.81xsw.com/',
	charset : 'gbk',

	// 提取出引數（如 URL）中的作品ID 以回傳。
	extract_work_id : function(work_information) {
		return /^[\d_]+$/.test(work_information) && work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	baidu_cse : '16095493717575840686',

	// 取得包含章節列表的文字範圍。
	get_chapter_list_contents : function(html) {
		return html.between('<div id="list">', '</div>');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
