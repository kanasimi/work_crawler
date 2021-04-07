/**
 * 批量下載 卡推漫画 的工具。 Download katui comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.qTcms2014');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2014({
	// 圖像檔案下載失敗處理方式：忽略/跳過圖像錯誤。當404圖像不存在、檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。default:false
	skip_error : true,

	// e.g., 蓝翅 http://www.700mh.com/manhua/736/
	acceptable_types : 'webp',

	// 2019/6: 改 http://www.katui.net/
	base_URL : 'http://www.700mh.com/',

	/**
	 * 處理特殊圖片: 遇到下架章節時圖片會顯示 http://fo.700mh.com/2018/03/14/pb.jpg
	 */
	is_limited_image_url : function(image_url) {
		// 這時 chapter_data.image_count 似乎全部都是 3
		return image_url.endsWith('2018/03/14/pb.jpg');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
