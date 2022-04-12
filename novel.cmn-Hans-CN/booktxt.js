/**
 * 批量下載 顶点小说 的工具。 Download booktxt novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.PTCMS');

// ----------------------------------------------------------------------------

// for Error: unable to verify the first certificate
// code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var crawler = CeL.PTCMS({
	base_URL : 'https://www.booktxt.net/',
	charset : 'gbk',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'https://so.biqusoso.com/s1.php?ie=gbk&siteid=booktxt.net&s=2758772450457967865&q=',
	parse_search_result : 'biquge',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return (work_id / 1000 | 0) +'_' + work_id + '/';
	},
	// 取得包含章節列表的文字範圍。
	get_chapter_list_contents : function(html) {
		return html.between('<div id="list">', '</div>');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
