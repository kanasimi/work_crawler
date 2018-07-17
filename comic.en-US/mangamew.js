/**
 * 批量下載 Manga Mew 的工具。 Download mangamew comics. (comic.en-US)
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var PATTERN_search_item = /<div class="item">\s*<a href="([^<>"]+)" title="([^<>"]+)"/g, PATTERN_chapter = /<li[^<>]*>\s*<a href="([^"<>]+)"[^<>]*>([^<>]+?)</g,
//
crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// one_by_one : true,
	base_URL : 'https://www1.mangamew.com/',

	// 規範 work id 的正規模式；提取出引數（如 URL）中的作品id 以回傳。
	extract_work_id : function(work_information) {
		return /^[a-z_\-\d]+$/.test(work_information) && work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search?keyword=',
	parse_search_result : function(html, get_label) {
		var id_list = [], id_data = [], matched;

		html = html.between('<div class="section-content">', '<footer');

		while (matched = PATTERN_search_item.exec(html)) {
			var id = matched[1].match(/\/([a-z_\-\d]+)\/$/),
			//
			title = get_label(matched[2]);
			if (title && id && (id = id[1])) {
				id_list.push(id);
				id_data.push(title);
			}
		}

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'manga/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1 class="title">', '</h1>'))

		// 選擇性屬性：須配合網站平台更改。
		};
		extract_work_data(work_data, html);
		extract_work_data(work_data, html.between('<ul class="dl', '</ul>'),
				/<li>\s*<span>([^<>]+)<\/span>([\s\S]+?)<\/li>/g);
		Object.assign(work_data, {
			author : work_data.Authors,
			status : work_data.Status
		});

		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		var matched;

		html = html.between('<span>Chapters:</span>').between(
				'<div class="section-content').between('<ul', '</ul>');
		work_data.chapter_list = [];

		while (matched = PATTERN_chapter.exec(html)) {
			var chapter_date = {
				title : get_label(matched[2]),
				url : matched[1]
			};
			work_data.chapter_list.push(chapter_date);
		}
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data = {
			// 設定必要的屬性。
			title : get_label(html.between(" selected='' >", '</option>')),
			image_list : []
		}, matched, PATTERN_image =
		//
		/<img class="img-responsive" src="([^<>"]+)"/g;

		html = html.between('<div id="content">', '<div id="settings"');

		while (matched = PATTERN_image.exec(html)) {
			chapter_data.image_list.push({
				url : matched[1]
			});
			if (matched[1].includes('.blogspot.com/')
					&& /\.jpg$/i.test(matched[1])) {
				// 下載 blogspot 的圖片會報錯，但似無缺損。或許需要加強圖片檢測機制？
				this.allow_EOI_error = true;
			}
		}

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
