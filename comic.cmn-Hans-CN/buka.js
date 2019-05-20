/**
 * 批量下載 珠海布卡科技有限公司 布卡漫画的工具。 Download buka comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

// 這PATTERN會直接跳過付費章節。
// [ all, part_title, additional_data, chapter_title, type, url, chapter NO ]
var PATTERN_chapter = /<span class="manga-episodes_text">([^<>"]+)<\/span>([\s\S]*?)<\/div>|<a [^<>]*?title="([^<>"]+)"[^<>]*?(href|onclick)="([^<>"]+)"[^<>]*>([\s\S]+?)<\/a>/g,
// [ all <img>, src, additional_data ]
PATTERN_image = /<img[\s\n]+src="([^<>"]+)"([^<>]*)>/g,
//
crawler = new CeL.work_crawler({
	// 當有多個分部的時候才重新檢查。
	recheck : 'multi_parts_changed',

	// one_by_one : true,
	base_URL : 'http://www.buka.cn/',

	// 有少數遺失圖片。
	skip_error : true,

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search?word=',
	parse_search_result : function(html, get_label) {
		var id_list = [], id_data = [];
		html = html.between('<div class="manga-list">', '</ul>')
		//
		.each_between('<div class="manga-names">', '</li>', function(text) {
			var matched = text.match(
			/**
			 * <code>

			<a href="/detail/222707" title="都市最强无良" class="manga-name">
			都市最强无良						</a>

			</code>
			 */
			/<a href="[^<>"]+?\/(\d+)" title="([^<>"]+)"[^<>]*>([\s\S]+?)<\/a>/
			//
			);
			// console.log([ text, matched ]);
			if (matched) {
				id_list.push(+matched[1]);
				id_data.push(get_label(matched[2]));
			}
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : 'detail/',
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between(
			//
			'<h1 class="title-font">', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			author : get_label(html.between(
			// <div class="manga-author">
			// 作者<a
			// href="/search.html?word=%E7%81%AB%E6%98%9F%E5%8A%A8%E6%BC%AB"
			// title="搜索作者:火星动漫" class="author">
			' class="author">', '</a>')),
			last_update : get_label(html.between(
			// 更新<span class="time">2019-05-17</span>
			'更新<span class="time">', '</span>')),
			grade : +get_label(html.between(
			//
			'<div class="manga-grade-num">', '</div>'))
		};

		extract_work_data(work_data, html);

		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		var matched, reverse_starts;

		function reverse() {
			var chapter_data, NO_in_part = 1,
			// reverse work_data.chapter_list[ reverse_starts ~ last ]
			list = work_data.chapter_list.splice(reverse_starts,
					work_data.chapter_list.length - reverse_starts);
			while (chapter_data = list.pop()) {
				chapter_data.NO_in_part = NO_in_part++;
				work_data.chapter_list.push(chapter_data);
			}
			reverse_starts = undefined;
		}

		work_data.inverted_order = true;
		work_data.chapter_list = [];

		html = html.between(
		//
		'<div class="manga-episodes_title">', '</section>');
		// work_data.some_limited = html.includes('onclick="payChapter(');

		// e.g., 我家大师兄脑子有坑 http://www.buka.cn/detail/104014.html
		while (matched = PATTERN_chapter.exec(html)) {
			// [ all, part_title, additional_data,
			// chapter_title, type, url, chapter NO ]
			if (matched[1]) {
				if (reverse_starts >= 0) {
					reverse();
				}
				this.set_part(work_data,
						get_label(matched[1].replace(/:$/, '')));

				if (matched[2] && matched[2].includes('data-sort="desc"')) {
					// 倒序
					reverse_starts = work_data.chapter_list.length;
				}

				continue;
			}

			var chapter_data = {
				title : get_label(matched[3]
				//
				.replace(work_data.title + ':', ''))
			};
			if (matched[4] === 'href') {
				chapter_data.url = matched[5];
			} else {
				matched = matched[5]
				// onclick="payChapter('/view/216443/65793.html','175-1',4.9);"
				.match(/payChapter\('([^"']+)','([^"']+)',(\d+(\.\d+)?)\)/);
				if (matched && +matched[3] > 0) {
					chapter_data.limited = +matched[3];
					chapter_data.url = matched[1];
					// chapter_data.title = matched[2];
				} else
					chapter_data.limited = true;
			}
			this.add_chapter(work_data, chapter_data);
		}

		if (reverse_starts >= 0) {
			reverse();
		}

		// console.log(work_data);
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		html = html.between('<div class="manga-imgs" id="manga-imgs">',
				'<div class="ewm-hook" id="ewm-hook">');

		var matched, chapter_data = work_data.chapter_list[chapter_NO - 1];
		chapter_data.image_list = [];

		while (matched = PATTERN_image.exec(html)) {
			// [ all <img>, src, additional_data ]
			matched[2] = matched[2].match(/[\s\n]data-original="([^<>"]+)"/);
			chapter_data.image_list.push(matched[2] ? matched[2][1]
					: matched[1]);
		}

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
