/**
 * 批量下載 pixivコミック(ぴくしぶこみっく) 的工具。 Download pixiv comic.
 * 
 * @since 2019/3 pixivコミック 大改版
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var base_URL = 'https://comic.pixiv.net/', crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// e.g., 785 働かないふたり 第45話
	skip_error : true,

	// 日本的線上漫畫網站習慣刪掉舊章節，因此每一次都必須從頭檢查。
	recheck : true,

	// one_by_one : true,
	base_URL : base_URL,

	// 解析 作品名稱 → 作品id get_work()
	store : false,
	search_URL : function(work_title) {
		return [ 'api/app/' + (this.store ? 'store' : 'works') + '/search/v2/'
		//
		+ encodeURIComponent(work_title), null, {
			headers : {
				// 'X-Requested-With' 可以用來判斷客戶端的請求是Ajax請求還是其他請求。
				'X-Requested-With' : base_URL
			}
		} ];
	},
	parse_search_result : function(html, get_label) {
		// console.log(html);

		// {"data":{"official_works":[{"id":5447,"name":"姫乃ちゃんに恋はまだ早い","author":"ゆずチリ","description":"相川姫乃、小学４年生。同級生の逢司くんに、恋心をうまく伝えらなくて――…。\r\u003cbr\u003eちょっとおませなラブコメディ開幕♪
		// \r\u003cbr\u003eコミックス第１巻は２月９日発売!!","like_count":11299,"image":{"main":"https://public-img-comic.pximg.net/c!/w=200,f=webp%3Ajpeg/images/work_main/5447.jpg?20190206095841","thumbnail":"https://public-img-comic.pximg.net/c!/q=90,f=webp%3Ajpeg/images/work_thumbnail/5447.jpg?20190206095841","main_big":"https://public-img-comic.pximg.net/images/work_main/5447.jpg?20190206095841"},"is_new_work":false,"pixiv_comic_badge":false,"last_story_read_start_at":1553828400000}]}}
		html = JSON.parse(html).data.official_works;
		return [ html, html ];
	},
	id_of_search_result : function(search_result) {
		return this.store ? 'store_' + search_result.key : search_result.id;
	},
	title_of_search_result : 'name',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		var matched = typeof work_id === 'string'
				&& work_id.match(/^store_([a-z\d]+)$/);
		return matched ? 'shop/products/' + matched[1] : [
				'api/app/works/v3/' + work_id, null, {
					headers : {
						// 'X-Requested-With' 可以用來判斷客戶端的請求是Ajax請求還是其他請求。
						'X-Requested-With' : base_URL + 'works/' + work_id
					}
				} ];
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		html = JSON.parse(html);
		// console.log(html);
		var work_data = html.data;
		html = work_data.official_work;

		Object.assign(work_data, {
			// 必要屬性：須配合網站平台更改。
			title : html[this.title_of_search_result],

			// 選擇性屬性：須配合網站平台更改。
			author : html.author,
			category : html.categories.map(function(category) {
				return category.name;
			}),
			tags : html.tags.map(function(tag) {
				return tag.name;
			}),

			// 因為沒有明確記載作品是否完結，一年沒更新就不再檢查。
			recheck_days : 400
		});

		// console.log(work_data.official_work.stories);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		work_data.chapter_list = work_data.official_work.stories.map(
		//
		function(chapter_data) {
			var story = chapter_data.story;
			if (!story)
				return;
			return {
				id : story.id,
				// 名稱顯示成兩行。
				title : story.short_name + (story.name ?
				// e.g., https://comic.pixiv.net/works/4252
				// .short_name="第13話", .name="（４）"
				/^[(（]/.test(story.name) ? story.name : ' ' + story.name : ''),
				limited : !chapter_data.readable && chapter_data.message,
				url : 'viewer/stories/' + story.id
			};
		}).filter(function(chapter_data) {
			return !!chapter_data;
		}).reverse();

		// 因為中間的章節可能已經被下架，因此依章節標題來定章節編號。
		this.set_chapter_NO_via_title(work_data);

		// console.log(work_data.official_work.stories);
	},

	pre_parse_chapter_data
	// 執行在解析章節資料 process_chapter_data() 之前的作業 (async)。
	// 必須自行保證執行 callback()，不丟出異常、中斷。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		var _this = this, html = XMLHttp.responseText, url = html.between(
		// <meta name="viewer-api-url"
		// content="/api/v1/viewer/stories/JXXtyieE41/50811.json">
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
			try {
				html = XMLHttp.responseText;
				if (/<html/.test(html)) {
					callback();
					return;
				}
				html = JSON.parse(html);
				if (html.error)
					throw html.error;
			} catch (e) {
				if (_this.skip_error)
					_this.onwarning(e);
				else
					_this.onerror(e);
				callback();
				return;
			}
			var chapter_data = work_data.chapter_list[chapter_NO - 1];
			chapter_data.token_data = html.data;
			_this.get_URL('/api/v1/viewer/stories/'
			// /api/v1/viewer/stories/___token___/00000.json
			+ chapter_data.token_data.token + '/' + chapter_data.id + '.json',
					callback, null, work_data.token_options);
		}, {}, work_data.token_options);
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		try {
			html = JSON.parse(html);
			if (html.error)
				throw html.error;
		} catch (e) {
			// エピソードの公開期限が過ぎました
			if (typeof html === 'string' && html.includes('期限')) {
				return {
					limited : html
				};
			}
			if (this.skip_error)
				this.onwarning(e);
			else
				this.onerror(e);
			return;
		}

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
		delete work_data['csrf-param'];
		this.save_work_data(work_data);
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

// 缺少這個會從章節頁面跳回作品頁面。
crawler.get_URL_options.cookie = 'open_work_page=yes';
start_crawler(crawler, typeof module === 'object' && module);
