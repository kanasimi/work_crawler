/**
 * 批量下載 友绘漫画网 的工具。 Download wuyouhui comics.
 * 
 * @see qTcms 晴天漫画程序 晴天漫画系统 手机端 http://manhua3.qingtiancms.com/
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.qTcms2017');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2017({
	// {Natural}最小容許圖案檔案大小 (bytes)。
	// MIN_LENGTH : 500,

	skip_error : true,

	base_URL : 'http://m.wuyouhui.net/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
