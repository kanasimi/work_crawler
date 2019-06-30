/**
 * 批量下載 360漫画 的工具。 Download 360taofu, http://www.xatxwh.com/ comics.
 * 
 * 晴天漫画程序 skin1 2011.06.24更新; 腾讯动漫模板?
 * 
 * @see qTcms 晴天漫画程序 晴天漫画系统 http://manhua2.qingtiancms.net/
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.qTcms2017');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2017({
	// 本站採用採集其他網站圖片的方法，錯漏圖片太多。
	skip_error : true,

	// one_by_one : true,

	// old: http://www.360taofu.com/ 360桃符??
	// 2019/4/24-25? 360漫畫網址更動: http://www.xatxwh.com/ → http://www.xueshine.com/
	base_URL : 'http://www.xueshine.com/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
