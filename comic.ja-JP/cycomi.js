/**
 * 批量下載 サイコミ 漫画 的工具。 Download Cygames, Inc. cycomi comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 日本的網路漫畫網站習慣刪掉舊章節，因此每一次都必須從頭檢查。
	// recheck : true,
	// 這個網站以日本網站來說比較特別，所有章節皆列在列表上。

	// one_by_one : true,
	base_URL : 'https://cycomi.com/',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'fw/cycomibrowser/chapter/title/' + work_id;
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			last_update : get_label(html
			// <p class="chapter-date">2019/02/18</p>
			.between('class="chapter-date">', '<')),

			// 選擇性屬性：須配合網站平台更改。
			// <p class="title-author">...</p>
			author : get_label(html.between('class="title-author">', '<')),
			// <span class="text-with-icon icon-favorite">69,968</span>
			favorite : get_label(html.between('icon-favorite">', '<')),
			// <span class="text-with-icon label-next-update">02月11日(月)</span>
			next_update : get_label(html.between('label-next-update">', '<'))
		};

		extract_work_data(work_data, html, null, true);

		if (!work_data.author
				&& (!work_data.title || work_data.title.includes('サイコミ'))) {
			var text = html.between('class="not-found', '</div>').between('>');
			// <div class="row not-found">
			// <div class="not-found-web">
			// <img class="no-opacity block" src="/img/404_pc.png"
			// alt="お探しのページが見つかりませんでした">
			// <p>このページは閲覧できません。</p>
			text = text.between('<img ', '>').between('alt="', '"')
					|| get_label(text);
			if (text) {
				work_data.removed = text;
			} else {
				// 2, 64: redirected to top page
			}
		}

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		var matched, PATTERN_chapter =
		// cycomi 2019/4/19 至5月間改版。
		// <a class="" href="/fw/cycomibrowser/chapter/pages/6792"
		// class="chapter-item">
		/<a [\s\S]*?href="([^<>"]+)" class="chapter-item">([\s\S]+?)<\/a>/g;

		work_data.chapter_list = [];
		while (matched = PATTERN_chapter.exec(html)) {
			var chapter_data = {
				url : matched[1],
				// <p class="chapter-title has-updated-label disabled">第３０話②</p>
				// <p class="chapter-title">第１話</p>
				title : get_label(matched[2].between('chapter-title">', '</')),
				// <p class="chapter-date">2019/02/04</p>
				date : matched[2].between('chapter-date">', '</')
			}, sub_title = get_label(matched[2].between(
					'class="chapter-desc">', '</'));
			if (sub_title) {
				// https://cycomi.com/fw/cycomibrowser/chapter/title/75 第７話
				chapter_data.title += ' ' + sub_title;
			}
			work_data.chapter_list.push(chapter_data);
		}

		// 2020/1/28-2/22間轉正序
		// work_data.chapter_list.reverse();

		// 因為中間的章節可能已經被下架，因此依章節標題來定章節編號。
		// 這個網站以日本網站來說比較特別，所有章節皆列在列表上。
		// this.set_chapter_NO_via_title(work_data);
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		Object.assign(chapter_data, {
			// 設定必要的屬性。
			image_count : html
			// <span id="viewer-max-page">19</span>
			.between('<span id="viewer-max-page">', '</span>')
			// 會算入一張 placeholder，無論在前頭或最後，無論存不存在。
			// e.g., https://cycomi.com/fw/cycomibrowser/chapter/pages/5135
			// 但也有例外: https://cycomi.com/fw/cycomibrowser/chapter/pages/3705
			- 1,
			image_list : []
		});

		html = html.between('<div class="swiper-slide">');
		html = html.between(null, 'viewer-last-page')
				|| html.between(null, '<div class="author');

		var matched, PATTERN_image = /<img\s[^<>]*?src="([^<>"]+)"/g;
		while (matched = PATTERN_image.exec(html)) {
			// delete matched.input;
			// console.log(matched);
			var url = matched[1];
			if (url.startsWith('data:image/')) {
				// assert: 應該只有第一張圖與最後一張圖為 placeholder。
				// <img
				// src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAAtJREFUCB1jYAACAAAFAAGNu5vzAAAAAElFTkSuQmCC"
				// alt="" class="viewer-image">
				if (!url.includes('png;base64,iVBORw0KGgoAAAANSUh')) {
					CeL.warn('網站似乎改版了？ ' + url);
					// console.log(chapter_data.image_list);
				}
				continue;
			}
			chapter_data.image_list.push(url);
		}

		// 有例外
		delete chapter_data.image_count;

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
