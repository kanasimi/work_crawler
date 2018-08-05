/**
 * 批量下載 Manga New 的工具。 Download manganew comics.
 * 
 * @see mangamew.js
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// one_by_one : true,
	base_URL : 'http://manganew.net/',

	// 規範 work id 的正規模式；提取出引數（如 URL）中的作品id 以回傳。
	extract_work_id : function(work_information) {
		return /^[a-z_\-\d]+$/.test(work_information) && work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'SuggestSearch.ashx?q=',
	parse_search_result : function(html, get_label) {
		var id_list = [], id_data = [],
		//
		PATTERN = /<li>([\s\S]+?)<\/li>/g, matched;

		while (matched = PATTERN.exec(html)) {
			var id = matched[1].match(/<a [^<>]*?href="([^<>"]+)">/),
			//
			title = get_label(matched[1].between('<h3>', '</h3>'));
			if (title && id && (id = id[1].between(this.base_URL))) {
				id_list.push(id);
				id_data.push(title);
			}
		}

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = JSON.parse(html.between(
				'<script type="application/ld+json">', '</script>'));
		extract_work_data(work_data, html);
		extract_work_data(work_data, html.between('<ul class="dl', '</ul>'),
				/<li>\s*<span>([^<>]+)<\/span>([\s\S]+?)<\/li>/g);
		Object.assign(work_data, {
			title : work_data.mainEntity.name,
			last_update : (work_data.Pubdate.between('-') || work_data.Pubdate)
					.trim()
		});

		return work_data;
	},
	get_chapter_list : function(work_data, html) {
		work_data.chapter_list = work_data.itemListElement
		//
		.map(function(chapter) {
			chapter.name = chapter.title;
			return chapter;
		}).reverse();
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data = {
			// 設定必要的屬性。
			title : get_label(html.between(' selected>', '</option>').replace(
					/^\s*🔹/, '')),
			image_list : []
		}, matched, PATTERN_image =
		//
		/<img [^<>]+?data-original="([^<>"]+)"[^<>]+?alt="([^<>"]+)"/g;

		html = html.between('<div id="content">',
				'<div class="next text-center">');

		while (matched = PATTERN_image.exec(html)) {
			chapter_data.image_list.push({
				title : matched[2],
				url : matched[1]
			});
		}

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
