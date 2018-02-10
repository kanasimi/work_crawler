/**
 * 批量下載网易漫画的工具。 Download 163 comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,
	// one_by_one : true,
	base_URL : 'https://manhua.163.com/',

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search/book/key/hints.json?key=',
	parse_search_result : function(html, get_label) {
		html = JSON.parse(html).books.data;
		var id_list = html.map(function(book) {
			book.title = get_label(book.title);
			return book.id = book.bookId;
		});
		return [ id_list, html ];
	},
	// id_of_search_result : function(cached_data) { return cached_data; },
	title_of_search_result : 'title',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'source/' + work_id;
	},
	parse_work_data : function(html, get_label) {
		var title = get_label(html.between(
				'<h1 class="f-toe sr-detail__heading">', '</h1>')),
		//
		text = html.between('<div class="sr-detail__middle js-detail-middle">',
				'<div class="sr-detail__bottom f-cb js-detail-bottom">'),
		//
		matched, PATTERN = /<dt>([^<>]+)<\/dt>[\s\n]*<dd>([\s\S]+?)<\/dd>/g,
		//
		// work_data={id,title,author,authors,chapter_count,last_update,last_download:{date,chapter}}
		work_data = {
			// 必要屬性：須配合網站平台更改。
			title : title,

			// 選擇性屬性：須配合網站平台更改。
			author : get_label(html.between(
					'<div class="sr-detail__author-text f-fl">', '<')),
			last_update : get_label(html.between(
			//
			'<div class="sr-notice__text f-toe', '</div>').between('>'))
		};

		while (matched = PATTERN.exec(text)) {
			work_data[get_label(matched[1])] = get_label(matched[2]);
		}

		// e.g., "连载中"
		work_data.status = work_data.状态;
		delete work_data.状态;
		work_data.description = work_data.简介;
		delete work_data.简介;
		work_data.题材 = work_data.题材.split(/[\s\n]+/);

		return work_data;
	},
	chapter_list_URL : function(work_id) {
		return 'book/catalog/' + work_id + '.json';
	},
	get_chapter_count : function(work_data, html) {
		var chapter_json = JSON.parse(html).catalog.sections;

		if (chapter_json.length < 1) {
			throw 'sections.length = ' + chapter_json.length + ', not 1!';
		}

		CeL.fs_write(work_data.directory
		//
		+ chapter_json[0].bookId + '.json', html);

		if (chapter_json.length === 1) {
			// 正常情況:只有第一章。
			work_data.chapter_list = chapter_json[0].sections;
			return;
		}

		// assert: sections >= 2
		work_data.chapter_list = [];
		function add_section(section) {
			if (Array.isArray(section.sections)) {
				// assert: section.leaf === false
				var title_hierarchy = this.clone();
				title_hierarchy.push(section.fullTitle);
				CeL.debug(title_hierarchy.join(' - '), 2);
				section.sections.forEach(add_section, title_hierarchy);
			} else {
				// assert: section.leaf && section.sectionId
				CeL.debug(section.fullTitle, 3);
				section.title_hierarchy = this;
				work_data.chapter_list.push(section);
			}
		}

		chapter_json.forEach(add_section, []);
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter_NO) {
		return 'reader/' + work_data.id + '/'
				+ work_data.chapter_list[chapter_NO - 1].sectionId;
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var seedLength = html.between('window.DATA.seedLength = ', ';') | 0,
		//
		chapter_data = html.between('window.PG_CONFIG', '</script>');
		chapter_data = 'chapter_data'
		//
		+ chapter_data.replace(/window\.PG_CONFIG/g, 'chapter_data')
		// 改成 true 會下載 webp
		.replace(/window\.IS_SUPPORT_WEBP/g, 'false');
		// console.log(chapter_data);
		eval(chapter_data);

		// 設定必要的屬性。
		chapter_data.title = chapter_data.section.fullTitle;
		chapter_data.image_list = chapter_data.images;
		// 2017/6/15 改版
		chapter_data.images.forEach(function(image) {
			image.url = image.url.slice(0, -seedLength);
		});

		chapter_data.limited = work_data.chapter_list[chapter_NO - 1].needPay;

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
