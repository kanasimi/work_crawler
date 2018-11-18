/**
 * 批量下載 KADOKAWA CORPORATION webエース ヤングエースUP（アップ） Webコミック 的工具。 Download YOUNG
 * ACE UP comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// one_by_one : true,
	base_URL : 'https://web-ace.jp/youngaceup/',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'contents/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = JSON.parse(html.between(
				'<script type="application/ld+json">', '</script>'));

		extract_work_data(work_data, html);

		// 放在這裡以預防被extract_work_data()覆蓋。
		Object.assign(work_data, {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>')),
			authors : html.all_between('<p class="author">', '</p>').map(
					get_label),

			// 選擇性屬性：須配合網站平台更改。
			subtitle : get_label(html.between('<p class="subtitle">', '</p>')),
			description : get_label(html.between('<div class="description">',
					'</div>')),
			status : html.between('<p class="genre">', '</p>').replace('ジャンル：',
					'').split(' / ').map(get_label),
			last_update : get_label(html.between('<span class="updated-date">',
					'</span>'))
					|| (new Date).toISOString(),
			next_update : html.all_between(
					'<span class="label_day-of-the-week">', '</span>').map(
					get_label)
			// 隔週火曜日更新 次回更新予定日：2018年11月27日
			.map(function(token) {
				return token.replace('次回更新予定日：', '');
			})
		});

		work_data.author = work_data.authors.map(function(name) {
			// 原作： 漫画： キャラクター原案：
			return name.replace(/^[^：]+：/, '').trim();
		});

		// console.log(work_data);
		return work_data;
	},
	chapter_list_URL : function(work_id, work_data) {
		return this.work_URL(work_id) + 'episode/';
	},
	get_chapter_list : function(work_data, html, get_label) {
		// <div class="container" id="read">
		html = html.between(' id="read">', '</section>')
		// <ul class="table-view">
		.between('<ul', '</ul>');

		work_data.chapter_list = [];
		var some_skipped;
		html.each_between('<li', '</li>', function(token) {
			var matched = token.between('<p class="yudo_wa">', '</div>');
			if (matched) {
				CeL.info(work_data.title + ': '
						+ get_label(matched).replace(/\s{2,}/g, ' '));
				some_skipped = true;
				return;
			}
			matched = token.match(/<a [^<>]*?href=["']([^"'<>]+)["'][^<>]*>/);
			var chapter_data = {
				title : get_label(token
				//
				.between('<p class="text-bold">', '</p>')),
				date : token.between('<span class="updated-date">', '</span>'),
				url : matched[1] + 'json/'
			};
			work_data.chapter_list.push(chapter_data);
		});
		work_data.chapter_list.reverse();

		if (some_skipped) {
			// 因為中間的章節可能已經被下架，因此依章節標題來定章節編號。
			this.set_chapter_NO_via_title(work_data);
		}
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		Object.assign(chapter_data, {
			// 設定必要的屬性。
			image_list : JSON.parse(html)
		});

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
