/**
 * 批量下載 漫画 的工具。 Download comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	one_by_one : true,
	base_URL : 'http://comics.mrblue.com/',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'MrBlueComicsData_04/webtoon/' + work_id + '/';
	},
	parse_work_data : function(html, get_label) {
		return CeL.null_Object();
	},
	get_chapter_list : function(work_data, html, get_label) {
		work_data.chapter_list = [ this.work_URL(work_data.id) ];
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// 設定必要的屬性。
		var chapter_data = {
			image_list : [ {
				url : this.work_URL(work_data.id) + chapter_NO
				// 1.pad(3)
				+ '/001.jpg'
			} ]
		};

		return chapter_data;
	},

	after_get_image : function(image_list, work_data, chapter_NO) {
		var image_data = image_list[image_list.index];
		if (!image_data.has_error) {
			// 下載本章節下一幅圖片。
			image_list.push({
				url : this.work_URL(work_data.id) + chapter_NO + '/'
						+ (image_list.length + 1).pad(3) + '.jpg'
			});
			return;
		}

		if (image_list.length === 1) {
			// 第一張圖就失敗了。結束下載本作品。
			return;
		}

		// 下載下一個章節的圖片。
		work_data.chapter_list(this.work_URL(work_data.id));
	},
	dynamical_count_images : true
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
