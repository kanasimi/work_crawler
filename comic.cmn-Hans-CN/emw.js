/**
 * 批量下載 一漫网 的工具。 Download emw comics.
 * 
 * @see qTcms 晴天漫画程序 晴天漫画系统
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

	// 2018? http://www.emw162.com/
	// 2019/8: http://www.muyict.com/
	base_URL : 'http://www.muyict.com/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
