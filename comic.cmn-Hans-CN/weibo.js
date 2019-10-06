/**
 * 批量下載 漫画-微博动漫- 的工具。 Download weibo comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,
	// one_by_one : true,
	base_URL : 'http://manhua.weibo.com/',
	API_URL : 'http://apiwap.vcomic.com/wbcomic/',

	// 最小容許圖案檔案大小 (bytes)。
	// 對於極少出現錯誤的網站，可以設定一個比較小的數值，並且設定.allow_EOI_error=false。因為這類型的網站要不是無法取得檔案，要不就是能夠取得完整的檔案；要取得破損檔案，並且已通過EOI測試的機會比較少。
	// 對於有些圖片只有一條細橫桿的情況。
	// MIN_LENGTH : 150,

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	skip_error : true,

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title, get_label) {
		return this.API_URL + 'home/search?page_num=1&rows_num=16&word='
				+ encodeURIComponent(work_title) + '&_request_from=pc';
	},
	parse_search_result : function(html, get_label) {
		// console.log(html);
		html = JSON.parse(html.trim()).data.data;
		return [ html, html ];
	},
	id_of_search_result : 'comic_id',
	title_of_search_result : 'name',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return this.API_URL + 'comic/comic_show?comic_id=' + work_id
				+ '&_request_from=pc';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// .trim(): 去除不可見的空白字元。
		var work_data = JSON.parse(html.trim()).data;
		// console.log(work_data);
		Object.assign(work_data, {
			// 必要屬性：須配合網站平台更改。
			title : work_data.comic.name,
			// or use {Array}work_data.new_author
			author : work_data.comic.sina_nickname,
			status : work_data.comic.is_end
			//
			&& work_data.comic.is_end !== "0" ? '连载中' : '已完结',
			some_limited : work_data.comic.chapter_default_price > 0
		// 選擇性屬性：須配合網站平台更改。
		});

		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		// console.log(work_data.chapter_list);
		// console.log(JSON.stringify(work_data.chapter_list));
		var free_chapter_hash = work_data.is_allow_read.comic.try_read_chapters
				.to_hash();
		// console.log(free_chapter_hash);
		work_data.chapter_list.forEach(function(chapter_data) {
			Object.assign(chapter_data, {
				limited : !(chapter_data.chapter_id in free_chapter_hash),
				title : chapter_data.chapter_name,
				url : this.API_URL + 'comic/comic_play?chapter_id='
						+ chapter_data.chapter_id + '&_request_from=pc'
			});
		}, this);
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);
		var chapter_data = JSON.parse(html.trim()).data, site_ver = 'site_ver='
				+ chapter_data.site_ver;

		// console.log(chapter_data);
		if (!chapter_data.json_content.page
		// 本章为付费章节
		&& !chapter_data.is_allow_read.is_chapter_read) {
			chapter_data.limited = true;
			return;
		}

		if (Array.isArray(chapter_data.json_content)
		// 本章为抢先看章节: "json_content":[]
		&& chapter_data.json_content.length === 0) {
			var time = chapter_data.chapter.charge_end_time * 1000;
			if (time > Date.now()) {
				CeL.info([
						this.id + ':',
						{
							T : [ '%1《%2》之後必須等到 %3  才能閱讀。跳過餘下的章節。',
									chapter_NO + '/' + work_data.chapter_count,
									chapter_data.chapter.chapter_name,
									(new Date(time)).format('%Y/%m/%d %H:%M') ]
						} ]);
				work_data.chapter_count = chapter_NO - 1;
				return;
			}
		}

		if (chapter_data.json_content.page.length === 1
		//
		&& !chapter_data.json_content.page[0].newImgUrl
		//
		&& chapter_data.json_content.page[0].mobileImgUrl) {
			CeL.warn([ this.id + ':', {
				T : [ '《%1》為會員專屬作品，必須充值後才能閱讀！', work_data.title ]
			} ]);
			return;
		}

		// chapter_data.image_count = chapter_data.json_content.header.pageNum;
		(chapter_data.image_list = chapter_data.json_content.page)
		// @see .formatImgSrc @
		// http://img.manhua.weibo.com/static/c/dist/static/js/play.js?version=11.19
		.forEach(function(image_data) {
			var url = image_data.newImgUrl;
			if (url.includes('?')) {
				if (/([&?])site_ver=/.test(url))
					url = url.replace(/([&?])site_ver=[^&]*/, '$1' + site_ver);
				else
					url += '&' + site_ver;
			} else {
				url += '?' + site_ver;
			}
			image_data.url = url;
		});

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
