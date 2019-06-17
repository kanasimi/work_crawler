/**
 * 批量下載 미스터블루 (Mr.Blue) 漫畫 的工具。 Download mrblue comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sequential');

// ----------------------------------------------------------------------------

var crawler = CeL.sequential({
	// http://www.mrblue.com/webtoon/all
	base_URL : 'http://comics.mrblue.com/',

	// 規範 work id 的正規模式；提取出引數中的作品id 以回傳。
	extract_work_id : function(work_information) {
		// e.g., "wt_HQ0005"
		if (/^[a-z_\-\d]+$/i.test(work_information))
			return work_information;
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		// 必須是圖片網址的起始部分。
		return 'MrBlueComicsData_04/webtoon/' + work_id + '/';
	},

	// 依照給定序列取得圖片網址。
	get_image_url : function(work_data, chapter_NO, image_index) {
		return this.work_URL(work_data.id) + chapter_NO + '/'
				+ (image_index + 1).pad(3) + '.jpg';
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
