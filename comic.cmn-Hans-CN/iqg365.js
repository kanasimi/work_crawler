/**
 * 批量下載 365漫画网 的工具。 Download iqg365.com comics.
 * 
 * @see qTcms 晴天漫画程序 晴天漫画系统 http://manhua3.qingtiancms.com/
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.qTcms2017');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2017({
	// 本站速度頗慢，必須等待較久否則容易中斷。
	// timeout : '60s',

	// {Natural}最小容許圖案檔案大小 (bytes)。
	// MIN_LENGTH : 500,

	base_URL : 'http://www.iqg365.com/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
