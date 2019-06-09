/**
 * 批量下載 e북포털 북큐브 漫畫 的工具。 Download bookcube comics.
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
	// 設定預設可容許的最小圖像大小。
	MIN_LENGTH : 6000,

	base_URL : 'https://toon.bookcube.com/',

	skip_get_work_page : true,
	skip_get_chapter_page : true,
	// 設定動態改變章節中的圖片數量。
	dynamical_count_images : true,

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		// 必須是圖片網址的起始部分。
		// e.g.,
		// https://toon.bookcube.com/toon/viewer/image.asp?webtoon_num=150087
		return 'toon/viewer/image.asp?webtoon_num=' + work_id;
	},
	// 解析出作品資料/作品詳情。
	parse_work_data : function(html, get_label) {
		// 先給一個空的初始化作品資料以便後續作業。
		return Object.create(null);
	},
	// 解析出章節列表。
	get_chapter_list : function(work_data, html, get_label) {
		if (!Object.hasOwnProperty(this, 'start_chapter')
				&& work_data.last_download.chapter > this.start_chapter) {
			// 未設定 .start_chapter 且之前下載過，則接續上一次的下載。
			this.start_chapter = work_data.last_download.chapter;
		}

		if (!Array.isArray(work_data.chapter_list)) {
			// 先給一個空的章節列表以便後續作業。
			work_data.chapter_list = [];
		}

		// reuse work_data.chapter_list
		while (work_data.chapter_list.length < this.start_chapter) {
			// 隨便墊入作品資料網址 給本次下載開始下載章節前所有未設定的章節資料，
			// 這樣才能準確從 .start_chapter 開始下載。後續章節網址會動態增加。
			work_data.chapter_list.push(this.work_URL(work_data.id));
		}
		// console.log(work_data);
	},

	// 解析出章節資料。
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// 設定必要的屬性。
		var chapter_data = {
			// 先給好本章節第一張圖片的網址。後續圖片網址會動態增加。
			// e.g.,
			// https://toon.bookcube.com/toon/viewer/image.asp?webtoon_num=150087&split_num=001&file_idx=1
			image_list : [ this.work_URL(work_data.id) + '&split_num='
					+ chapter_NO.pad(3) + '&file_idx=' + (0 + 1) ]
		};

		// console.log(chapter_data);
		return chapter_data;
	},

	// 每個圖片下載結束都會執行一次。
	after_get_image : function(image_list, work_data, chapter_NO) {
		// console.log(image_list);
		var latest_image_data = image_list[image_list.index];
		// console.log(latest_image_data);
		if (!latest_image_data.has_error) {
			// CeL.debug(work_data.id + ': 本章節上一張圖片下載成功。下載本章節下一幅圖片。');
			image_list.push(this.work_URL(work_data.id) + '&split_num='
					+ chapter_NO.pad(3) + '&file_idx='
					+ (image_list.length + 1));
			return;
		}

		if (image_list.length === 1) {
			// CeL.debug(work_data.id + ': 第一張圖就下載失敗了。結束下載本作品。');
			return;
		}

		// CeL.debug(work_data.id + ': 本章節上一張圖片下載失敗。下載下一個章節的圖片。');
		work_data.chapter_list.push(this.work_URL(work_data.id));
		// 動態增加章節，必須手動增加章節數量。
		work_data.chapter_count++;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
