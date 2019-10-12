/**
 * 批量下載 e북포털 북큐브 漫畫 的工具。 Download bookcube comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.sequential');

// ----------------------------------------------------------------------------

var crawler = CeL.sequential({
	// 設定預設可容許的最小圖像大小。
	MIN_LENGTH : 6000,

	base_URL : 'https://toon.bookcube.com/',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		// 必須是圖片網址的起始部分。
		// e.g.,
		// https://toon.bookcube.com/toon/viewer/image.asp?webtoon_num=150087
		return 'toon/viewer/image.asp?webtoon_num=' + work_id;
	},

	// 依照給定序列取得圖片網址。
	get_image_url : function(work_data, chapter_NO, image_index) {
		// e.g.,
		// https://toon.bookcube.com/toon/viewer/image.asp?webtoon_num=150087&split_num=001&file_idx=1
		return this.work_URL(work_data.id) + '&split_num=' + chapter_NO.pad(3)
				+ '&file_idx=' + (image_index + 1);
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
