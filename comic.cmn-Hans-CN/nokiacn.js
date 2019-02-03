/**
 * 批量下載 乙女漫画 的工具。 Download nokiacn.net comics.
 * 
 * @see qTcms 晴天漫画程序 晴天漫画系统 http://manhua3.qingtiancms.com/
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.qTcms2017');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2017({
	// {Natural}最小容許圖案檔案大小 (bytes)。
	MIN_LENGTH : 500,

	base_URL : 'http://www.nokiacn.net/',

	image_base_url : 'http://n.aiwenwo.net:55888'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
