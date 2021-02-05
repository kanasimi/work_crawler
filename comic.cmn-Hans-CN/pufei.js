/**
 * 批量下載 扑飞漫画 的工具。 Download pufei comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.qTcms2014');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2014({
	// 圖像檔案下載失敗處理方式：忽略/跳過圖像錯誤。當404圖像不存在、檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。default:false
	skip_error : true,

	// 出錯：連線中斷
	one_by_one : true,

	// old: http://www.pufei.net/
	// 2020/2/17 http://www.pufei8.com/
	base_URL : 'http://www.pufei8.com/',

	postfix_image_url : function(url) {
		// http://www.pufei8.com/manhua/32508/index.html
		if (/^https?:\/\//.test(url))
			return url;

		// 2020/2/17 @see function loadview() @
		// http://www.pufei.net/skin/2014mh/view.js
		return 'http://res.img.fffimage.com/' + url;

		// @see function loadview() @ /skin/2014mh/view.js
		return 'http://res.img.pufei.net/' + url;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
