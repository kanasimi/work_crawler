/**
 * 批量下載HH漫画 汗汗酷漫的工具。 Download hhcool comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.hhcool');

// ----------------------------------------------------------------------------

CeL.hhcool({

	// base_URL : 'http://www.hhcool.com/',
	// 2018/4/27? 汗汗酷漫更改域名。最後一次存取: 2018/4/27 14:18
	// 2019/4 NG: http://www.hheehh.com/
	// 2019/4 NG: http://www.huhumh.com/
	// 2019/4 內容圖源相同: http://www.huhudm.com/ http://www.hhmmoo.com/
	base_URL : 'http://www.hhimm.com/'

}, function(crawler) {
	start_crawler(crawler, typeof module === 'object' && module);
}, function(crawler) {
	setup_crawler(crawler, typeof module === 'object' && module);
});
