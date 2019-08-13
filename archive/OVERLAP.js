/**
 * 批量下載 OVERLAP - オーバーラップ コミックガルド 的工具。 Download OVERLAP GARDO comics.
 * 
 * @see ActiBook https://ebook.digitalink.ne.jp/
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 日本的網路漫畫網站習慣刪掉舊章節，因此每一次都必須從頭檢查。
	recheck : true,

	// one_by_one : true,
	base_URL : 'https://over-lap.co.jp/',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'Form/Product/ProductDetail.aspx?cat=CGS&pid=' + 'ZG'
				+ work_id.pad(4);
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			author : html.between('<div class="auth">', '</div>').split(
					'</span>').map(get_label).filter(function(name) {
				return !!name;
			}).map(function(name) {
				matched = name.match(/(?:著|原作)／(.+)/);
				return matched ? matched[1].trim() : name;
			}),

			// 選擇性屬性：須配合網站平台更改。
			last_update : get_label(html.between('<div class="limit">',
					'</div>'))
					|| (new Date).toISOString()
		}, matched = work_data.last_update
				.match(/[^\d](\d{4}[.\-\/]\d{1,2}[.\-\/]\d{1,2})[^\d]/);

		if (matched) {
			work_data.last_update = matched[1];
		}

		extract_work_data(work_data, html);

		// 放在這裡以預防被extract_work_data()覆蓋。
		Object.assign(work_data, {
			description : get_label(html.between('<div id="main_text">',
					'<div id="main_release">').between('<p>', '</p>'))
		});

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		var matched, PATTERN_chapter = /<div class="number"([\s\S]+?)<\/div>/g;

		work_data.chapter_list = [];
		while (matched = PATTERN_chapter.exec(html)) {
			var base_URL = matched[1].match(
			//
			/ href="([^<>"]*\/gardo\/series\/([^<>"\/]+)\/)/)[1];
			// @see iPhonePath
			// https://over-lap.co.jp/gardo/series/????/HTML5/assets/javascripts/application.js
			var chapter_data = {
				base_URL : base_URL,
				url : base_URL + 'iPhone/ibook.xml',
				title : get_label(matched[1].between('<h2>', '</h2>'))
			};
			work_data.chapter_list.push(chapter_data);
		}
		work_data.chapter_list.reverse();

		// 因為中間的章節可能已經被下架，因此依章節標題來定章節編號。
		this.set_chapter_NO_via_title(work_data);
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		Object.assign(chapter_data, {
			// 設定必要的屬性。
			title : get_label(html.between('<title>', '</title>')),
			image_count : html.between('<total>', '</total>') | 0,
			image_list : []
		});

		for (var index = 0; index < chapter_data.image_count;) {
			chapter_data.image_list.push(chapter_data.base_URL
					+ 'books/images/2/' + ++index + '.jpg');
		}

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
