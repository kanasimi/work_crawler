/**
 * 批量下載 pixivコミック(ぴくしぶこみっく) 的工具。 Download pixiv comic.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 日本的線上漫畫網站習慣刪掉舊章節，因此每一次都必須從頭檢查。
	recheck : true,

	// one_by_one : true,
	base_URL : 'https://comic.pixiv.net/',

	// 解析 作品名稱 → 作品id get_work()
	store : false,
	search_URL : function(work_title) {
		return (this.store ? 'store/search/' : 'search/')
		// this.store: ストア作品
		+ encodeURIComponent(work_title);
	},
	parse_search_result : function(html, get_label) {
		var id_list = [], id_data = [], text = html.between(
				'<div class="layout-searches">', '</section>');
		if (text) {
			html.each_between('<div class="search-item">', '</a></div>',
			//
			function(text) {
				var url = text.match(/ href="([^<>"]+)"/),
				//
				title = get_label(text.between('<p class="search-title">',
						'</p>'));
				id_list.push(url[1].match(/\/(\d+)$/)[1]);
				id_data.push(title);
			});
		} else {
			// ストア作品
			text = html.between('<div class="work-list flexwrap">');
			html.each_between('<div class="items"', '</h5></div>',
			//
			function(text) {
				var title = get_label(text.between('<h4 class="work-title">',
						'</h4>')), url = title.match(/ href="([^<>"]+)"/);
				id_list.push('store_' + url[1].match(/\/([a-z\d]+)$/)[1]);
				id_data.push(title);
			});
		}

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		var matched = work_id.match(/^store_([a-z\d]+)$/);
		return matched ? 'store/products/' + matched[1] : 'works/' + work_id;
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。

			// 選擇性屬性：須配合網站平台更改。
			author : get_label(html.between('<h2 class="author">', '</h2>')),
			category : html.all_between(' class="category"', '</div>').map(
			// カテゴリ e.g., https://comic.pixiv.net/works/3202
			function(token) {
				return get_label(token.between('>'));
			}),
			tags : html.between('<ul class="work-tags">', '</ul>').between(
					null, {
						tail : '</li>'
					}).split('</li>').map(get_label),
			description : get_label(html.between(
					'<p class="description-content">', '</p>')),
			last_update : html.between('<section class="episodes">',
					'</section>').between(
					'<div class="episode__read-start-at">', '</div>').replace(
					/更新日:/, '').trim()
		};

		extract_work_data(work_data, html);

		// 因為沒有明確記載作品是否完結，一年沒更新就不再檢查。
		work_data.recheck_days = 400;

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		var matched, PATTERN_chapter = /<a id="(\d+)"([\s\S]+?)<\/a>/g;
		// https://comic.pixiv.net/works/3858 https://comic.pixiv.net/works/3731
		html = html.between('<section class="episodes">', '</section>');

		work_data.chapter_list = [];
		while (matched = PATTERN_chapter.exec(html)) {
			var text = matched[2];
			var chapter_data = {
				id : matched[1],
				title : get_label(text.between('<div class="episode__number">',
						'</div>')),
				url : 'viewer/stories/' + matched[1],
				date : text.between('<div class="episode__read-start-at">',
						'</div>').replace(/更新日:/, '').trim()
			};
			matched = text.match(/<img [^<>]+?data-src="([^<>"]+)"/);
			if (matched) {
				chapter_data.cover_url = matched[1];
			}
			text = get_label(text.between('<div class="episode__title">',
					'</div>'));
			if (text) {
				chapter_data.title += (chapter_data.title ? ' ' : '') + text;
			}

			work_data.chapter_list.push(chapter_data);
		}
		work_data.chapter_list.reverse();

		// 因為中間的章節可能已經被下架，因此依章節標題來定章節編號。
		this.set_chapter_NO_via_title(work_data);

		// console.log(work_data);
	},

	pre_parse_chapter_data
	// 執行在解析章節資料 process_chapter_data() 之前的作業 (async)。必須自行保證不丟出異常。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		var _this = this, html = XMLHttp.responseText, url = html.between(
				'<meta name="viewer-api-url" content="', '"');
		work_data.token_options = {
			headers : {
				// work_data['csrf-token']
				'X-CSRF-Token' : html.between(
						'<meta name="csrf-token" content="', '"'),
				// @see jQuery
				'X-Requested-With' : 'XMLHttpRequest'
			}
		};

		if (url) {
			this.get_URL(url, callback, null, work_data.token_options);
			return;
		}

		// https://comic.pixiv.net/assets/viewer-ae2940cef41fd61c265fde4c14916a3f49e96326e5542df3a12cc9a06fce8678.js
		// 'X-CSRF-Token': e('meta[name="csrf-token"]').attr('content')
		this.get_URL(html.between('<meta name="token-api-url" content="',
		// /api/v1/viewer/token/d220bbe0ed815ceea5fd0308021fff9f.json
		'"'), function(XMLHttp) {
			html = JSON.parse(XMLHttp.responseText);
			if (html.error)
				throw html.error;
			var chapter_data = work_data.chapter_list[chapter_NO - 1];
			chapter_data.token_data = html.data;
			_this.get_URL('/api/v1/viewer/stories/'
			// /api/v1/viewer/stories/___token___/00000.json
			+ chapter_data.token_data.token + '/' + chapter_data.id + '.json',
					callback, null, work_data.token_options);
		}, {}, work_data.token_options);
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		html = JSON.parse(html);
		if (html.error)
			throw html.error;

		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		// 避免覆寫 chapter_data.title
		chapter_data = Object.assign(html.data, chapter_data);
		html = html.data.contents;
		if (html.length !== 1) {
			throw '.length = ' + html.length;
		}
		// 設定必要的屬性。
		chapter_data.image_list = [];
		html[0].pages.forEach(function(view) {
			for ( var page in view) {
				if (false)
					// 可行，但q=90會得到與q=50一樣的東西。
					view[page].data.url = view[page].data.url.replace(
							/q=[1-8]\d,/, 'q=90,')
				chapter_data.image_list.push(view[page].data);
			}
		});

		return chapter_data;
	},

	finish_up : function(work_data) {
		// 不記錄 token。
		delete work_data['csrf-token'];
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
