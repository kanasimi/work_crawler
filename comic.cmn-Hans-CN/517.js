/**
 * 批量下載 我要去漫画 的工具。 Download 517manhua.com comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.qTcms2017');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2017({
	// 圖像檔案下載失敗處理方式：忽略/跳過圖像錯誤。當404圖像不存在、檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。default:false
	skip_error : true,

	// one_by_one : true,

	// {Natural|String|Function}當網站不允許太過頻繁的訪問讀取/access時，可以設定下載章節資訊/章節內容前的等待時間。
	// 2019/5/8 5s: OK
	// 2019/5/9 200: OK
	// chapter_time_interval : 100,

	// e.g.,
	// http://pic1.085p.com/upload23/72889/2019/01-13/20190113193831_8982xtnnvyuu_small.jpg
	// {Natural}MIN_LENGTH:最小容許圖案檔案大小 (bytes)。
	MIN_LENGTH : 200,

	base_URL : 'http://www.517manhua.com/',

	// 2020-09-09T08:08:55.000Z 改版
	// http://www.517manhua.com/template/skin1_3687/css/d7s/js/show.20170501.js?20201205201326
	qTcms_m_indexurl : "http://images.yiguahai.com/"

});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
