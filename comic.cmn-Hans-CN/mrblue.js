/**
 * 批量下載 미스터블루 (Mr.Blue) 漫画 的工具。 Download mrblue comics.
 * 
 * 本檔案為僅僅利用可預測的圖片網址序列去下載漫畫作品，不 fetch 作品與章節頁面的範例。
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	one_by_one : true,
	skip_error : true,
	preserve_bad_image : false,
	MAX_ERROR_RETRY : 2,

	// http://www.mrblue.com/webtoon/all
	base_URL : 'http://comics.mrblue.com/',

	extract_work_id : function(work_information) {
		if (/^[a-z_\-\d]+$/.test(work_information))
			return work_information;
	},

	skip_get_work_page : true,
	skip_get_chapter_page : true,

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'MrBlueComicsData_04/webtoon/' + work_id + '/';
	},
	parse_work_data : function(html, get_label) {
		return CeL.null_Object();
	},
	get_chapter_list : function(work_data, html, get_label) {
		if (!Object.hasOwnProperty(this, 'start_chapter')
				&& work_data.last_download.chapter >= 1) {
			// 接續上一次的下載。
			this.start_chapter = work_data.last_download.chapter;
		}

		if (!Array.isArray(work_data.chapter_list))
			work_data.chapter_list = [];

		// reuse work_data.chapter_list
		while (work_data.chapter_list.length < this.start_chapter)
			work_data.chapter_list.push(this.work_URL(work_data.id));
		// console.log(work_data);
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

		// console.log(chapter_data);
		return chapter_data;
	},

	after_get_images : function(image_list, work_data, chapter_NO) {
		// console.log(image_list);
		var latest_image_data = image_list[image_list.index];
		// console.log(latest_image_data);
		if (!latest_image_data.has_error) {
			// CeL.debug(work_data.id + ': 本章節上一張圖片下載成功。下載本章節下一幅圖片。');
			image_list.push(this.work_URL(work_data.id) + chapter_NO + '/'
					+ (image_list.length + 1).pad(3) + '.jpg');
			return;
		}

		if (image_list.length === 1) {
			// CeL.debug(work_data.id + ': 第一張圖就失敗了。結束下載本作品。');
			return;
		}

		// CeL.debug(work_data.id + ': 本章節上一張圖片下載失敗。下載下一個章節的圖片。');
		work_data.chapter_list.push(this.work_URL(work_data.id));
		// 動態增加章節，必須手動增加章節數量。
		work_data.chapter_count++;
	},
	// 動態改變章節中的圖片數量。
	dynamical_count_images : true
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
