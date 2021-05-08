/**
 * 批量下載 珠海布卡科技有限公司 布卡漫画的工具。 Download buka comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

// 這PATTERN會直接跳過付費章節。
// [ all, part_title, part_additional_data, chapter_title, type, url, chapter NO
// ]
var PATTERN_chapter = /<span class="manga-episodes_text">([^<>"]+)<\/span>([\s\S]*?)<\/div>|<a [^<>]*?title="([^<>"]+)"[^<>]*?(href|onclick)="([^<>"]+)"[^<>]*>([\s\S]+?)<\/a>/g,
// [ all <img>, src, image_additional_data ]
PATTERN_image = /<img[\s\n]+src="([^<>"]+)"([^<>]*)>/g,
//
crawler = new CeL.work_crawler({
	// 當有多個分部的時候才重新檢查。
	recheck : 'multi_parts_changed',

	// one_by_one : true,
	base_URL : 'http://www.buka.cn/',

	// 有些遺失圖片。
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
		var matched, part_starts_index = 0;
		var chapter_list = work_data.chapter_list = [];
		// work_data.inverted_order = true;

		function get_cid(index) {
			var chapter_data = chapter_list[index];
			if (!chapter_data || !chapter_data.url)
				return;
			// console.log(chapter_data);
			var cid = chapter_data.url.match(/\/(\d+)\.html$/);
			// console.log(cid);
			if (cid)
				return +cid[1];
		}

		function check_reverse() {
			var reversed_count = 0, index = part_starts_index;
			var latest_cid = get_cid(index);
			// 檢查每個章節的 cid 來確認到底是正序還是倒序。
			while (++index < chapter_list.length) {
				var cid = get_cid(index);
				if (latest_cid < cid) {
					reversed_count--;
				} else if (latest_cid > cid) {
					reversed_count++;
				}
				latest_cid = cid;
			}
			// console.log(reversed_count);
			if (reversed_count <= 0) {
				return;
			}

			var chapter_data, NO_in_part = 1,
			// reverse chapter_list[ part_starts_index ~ last ]
			list = chapter_list.splice(part_starts_index, chapter_list.length
					- part_starts_index);
			while (chapter_data = list.pop()) {
				// reset NO_in_part
				chapter_data.NO_in_part = NO_in_part++;
				chapter_list.push(chapter_data);
			}
		}

		matched = html.match(
		// 20190829 發現有此功能。但沒有附上 part_title，因此僅供參考用。
		// chapters: { n: [连载(话)], vol: [单行本??], sp: [番外篇] }
		/<script>[\s\n]*var\s+chapters\s*=([\s\S]+?)<\/script>/);
		if (matched) {
			matched = matched[1].replace(/[;\s]+$/, '');
			// console.log(matched);
			work_data.chapters = JSON.parse(matched);
		}
		// console.log(work_data.chapters);

		html = html.between(
		//
		'<div class="manga-episodes_title">', '</section>');
		// work_data.some_limited = html.includes('onclick="payChapter(');

		/**
		 * e.g., <code>

		multi parts 我家大师兄脑子有坑 http://www.buka.cn/detail/104014.html
		http://www.buka.cn/detail/217885.html
		
		正序	http://www.buka.cn/detail/222809.html
		http://www.buka.cn/detail/221313

		倒序 http://www.buka.cn/detail/223255
		http://www.buka.cn/detail/221802.html

		</code>
		 */
		while (matched = PATTERN_chapter.exec(html)) {
			// [ all, part_title, part_additional_data,
			// chapter_title, type, url, chapter NO ]
			if (matched[1]) {
				// a new part
				check_reverse();
				this.set_part(work_data,
						get_label(matched[1].replace(/:$/, '')));

				part_starts_index = chapter_list.length;
				if (false && matched[2]
						&& matched[2].includes('data-sort="desc"')) {
					// 正序。沒有的也不見得是倒序。
					// http://www.buka.cn/detail/221313
					// http://www.buka.cn/detail/222809

					// 倒序。
					// http://www.buka.cn/detail/221115
					// http://www.buka.cn/detail/223255
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

		check_reverse();

		// console.log(work_data);
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// <!--头部结束-->
		// <!--漫画主体内容开始-->
		// console.trace(html);
		html = html.between('<div class="manga-imgs" id="manga-imgs">',
				'<div class="ewm-hook" id="ewm-hook">');

		var matched, chapter_data = work_data.chapter_list[chapter_NO - 1];
		chapter_data.image_list = [];

		// console.trace(html);
		while (matched = PATTERN_image.exec(html)) {
			// console.trace(matched.slice());
			// [ all <img>, src, image_additional_data ]
			matched[2] = matched[2].match(/[\s\n]data-original="([^<>"]+)"/);
			chapter_data.image_list.push(matched[2] ? matched[2][1]
					: matched[1]);
		}
		if (chapter_data.image_list.length === 0
		// <div class="download-area">
		&& html.includes('<div class="download-area">')
		// <div class="title">
		// 此章节需要使用客户端观看
		// </div>
		&& (matched = get_label(html
		// <div class="title title-small">
		// 请下载客户端(｡・`ω´･)
		// </div>
		.between('<div class="title">', '</div>')))) {
			chapter_data.limited = matched;
		}

		// console.log(chapter_data);
		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
