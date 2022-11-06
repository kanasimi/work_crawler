/**
 * 批量下載 乙女漫画 的工具。 Download yinvmh.com comics.
 * 
 * 整體採 qTcms 晴天漫画程序 晴天漫画系统 http://manhua3.qingtiancms.com/
 * 
 * 僅顯示作品頁面採用 dm5
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.net.work_crawler.sites.qTcms2017',
		'application.net.work_crawler.sites.dm5' ]);

// ----------------------------------------------------------------------------

var crawler = CeL.dm5({
	base_URL : 'https://www.yinvmh.com/'
});

crawler = CeL.qTcms2017({
	base_URL : crawler.base_URL,
	parse_work_data : crawler.parse_work_data,
	get_chapter_list : crawler.get_chapter_list,

	// 圖像檔案下載失敗處理方式：忽略/跳過圖像錯誤。當404圖像不存在、檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。default:false
	skip_error : true
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
