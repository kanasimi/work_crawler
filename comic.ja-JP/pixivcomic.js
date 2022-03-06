/**
 * 批量下載 pixivコミック(ぴくしぶこみっく) 的工具。 Download pixiv comic.
 * 
 * @since 2019/3 pixivコミック 大改版
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var base_URL = 'https://comic.pixiv.net/', crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// e.g., 785 働かないふたり 第45話
	skip_error : true,

	// 日本的網路漫畫網站習慣刪掉舊章節，因此每一次都必須從頭檢查。
	recheck : true,

	acceptable_types : 'webp|jpg',

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

		// console.trace(work_data.chapter_list);
		// console.log(work_data.official_work.stories);
	},

	pre_parse_chapter_data
	// 執行在解析章節資料 process_chapter_data() 之前的作業 (async)。
	// 必須自行保證執行 callback()，不丟出異常、中斷。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		// console.log(XMLHttp);
		var html = XMLHttp.responseText;
		work_data.token_options = {
			error_retry : this.MAX_ERROR_RETRY,
			headers : {
				// work_data['csrf-token']
				'X-CSRF-Token' : html.between(
						'<meta name="csrf-token" content="', '"'),
				// @see jQuery
				'X-Requested-With' : 'XMLHttpRequest'
			}
		};
		// console.trace(work_data.token_options);

		var url = html.between(
		// <meta name="viewer-api-url"
		// content="/api/v1/viewer/stories/JXXtyieE41/50811.json">
		'<meta name="viewer-api-url" content="', '"');
		// console.log(url);
		if (url) {
			this.get_URL(url, callback, null, work_data.token_options);
			return;
		}

		var chapter_data = work_data.chapter_list[chapter_NO - 1];

		url = html.between(
				'<script id="__NEXT_DATA__" type="application/json">',
				'</script>');
		// console.trace(url);
		if (url) {
			// 2020/6 via Google Chrome
			Object.assign(chapter_data, JSON.parse(url));

			var salt = chapter_data.runtimeConfig
			//
			&& chapter_data.runtimeConfig.salt
			// 2020/8/20: No chapter_data.runtimeConfig supported
			// salt is defined directly @
			// https://comic.pixiv.net/_next/static/chunks/b60f68a1e08e7dab72e67792ea4c65a79a5af442.445088b0d1a2f05514d5.js
			// t.update("".concat(e).concat("mAtW1X8SzGS880fsjEXlM73QpS1i4kUMBhyhdaYySk8nWz533nrEunaSplg63fzT"))
			|| ('mAtW1X8SzGS880fsjEXlM73QpS1i4k'
			//
			+ 'UMBhyhdaYySk8nWz533nrEunaSplg63fzT');
			var hash, time = (new Date).format('%Y-%2m-%2dT%2H:%2M:%2S%z')
					.replace(/(\d{2})$/, ':$1');
			if (this.forge) {
				hash = this.forge.md.md5.create();
				hash.update(time + salt);
				hash = hash.digest().toHex();
			} else {
				hash = this.CryptoJS.MD5(time + salt).toString(
						this.CryptoJS.enc.Hex);
			}

			// key: "getApiAppEpisodesIdReadRaw",
			// https://comic.pixiv.net/_next/static/chunks/eb04f3552258e45f2446579a418399595863319c.e75f48a4015b43818882.js
			// includes https://github.com/dmtrKovalenko/date-io
			url = '/api/app/episodes/' + chapter_data.id + '/read';
			// u.t.getApiAppEpisodesIdRead({xRequestedWith: u.z,
			// https://comic.pixiv.net/_next/static/chunks/f76487c2815c6c0d6b3ac60de8a5a43085d6b6a4.38d2c49607f3f81dc8e8.js
			this.setup_value('Referer', this.full_URL(this.chapter_URL(
					work_data, chapter_NO)));
			Object.assign(this.get_URL_options.headers, {
				// Authorization : 'Bearer ' +
				// this.configuration.accessToken("Bearer", []),

				'X-Requested-With' : this.id/* "pixivcomic" */,
				'X-Client-Time' : time,
				'X-Client-Hash' : hash
			});
			// console.trace([ url, this.get_URL_options ]);
			this.get_URL(url, callback, null, work_data.token_options);
			return;
		}

		url = html.between('<meta name="token-api-url" content="',
		// /api/v1/viewer/token/d220bbe0ed815ceea5fd0308021fff9f.json
		'"');
		// console.trace(url);
		if (!url) {
			if (typeof html === 'string' && html.includes('期限')) {
				// e.g., html==="エピソードの公開期限が過ぎました"
				chapter_data.limited = html;
			}
			callback();
			return;
		}

		// https://comic.pixiv.net/assets/viewer-ae2940cef41fd61c265fde4c14916a3f49e96326e5542df3a12cc9a06fce8678.js
		// 'X-CSRF-Token': e('meta[name="csrf-token"]').attr('content')
		this.get_URL(url, function(XMLHttp, error) {
			// console.trace(XMLHttp);
			try {
				html = XMLHttp.responseText;
				if (/<html/.test(html)) {
					callback();
					return;
				}
				if (html === undefined) {
					console.log(XMLHttp);
				}

				html = JSON.parse(html);
				if (html.error)
					throw html.error;
			} catch (e) {
				if (this.skip_error)
					this.onwarning(e);
				else
					this.onerror(e);
				callback();
				return;
			}

			chapter_data.token_data = html.data;
			this.get_URL('/api/v1/viewer/stories/'
			// /api/v1/viewer/stories/___token___/00000.json
			+ chapter_data.token_data.token + '/' + chapter_data.id + '.json',
					callback, null, work_data.token_options);
		}.bind(this), {}, work_data.token_options);
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.trace(html);
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		try {
			html = JSON.parse(html);
			if (html.error)
				throw html.error;
		} catch (e) {
			// console.debug(html);
			if (typeof html === 'string' && html.includes('期限')) {
				// e.g., html==="エピソードの公開期限が過ぎました"
				chapter_data.limited = html;
			} else if (this.skip_error)
				this.onwarning(e);
			else
				this.onerror(e);
			return chapter_data;
		}

		// 避免覆寫 chapter_data.title
		chapter_data = Object.assign(html.data, chapter_data);
		if (html.data.reading_episode) {
			// 2020/6 via Google Chrome
			chapter_data.image_list = html.data.reading_episode.pages;
		} else {
			html = html.data.contents;
			if (html.length !== 1) {
				throw new Error('.length = ' + html.length);
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
		}

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
crawler.setup_value('cookie', 'open_work_page=yes');

setup_crawler(crawler, typeof module === 'object' && module);

CeL.get_URL_cache(
// https://cdnjs.com/libraries/crypto-js
'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js',
// https://cryptojs.gitbook.io/docs/
// https://github.com/brix/crypto-js
function(contents) {
	crawler.CryptoJS = require(crawler.main_directory
	//
	+ 'crypto-js.min.js');
	// console.log(crawler.CryptoJS.MD5('text').toString(crawler.CryptoJS.enc.Hex));
	start_crawler(crawler, typeof module === 'object' && module);
}, {
	directory : crawler.main_directory
});

if (false) {
	CeL.get_URL_cache(
	//
	'https://cdn.jsdelivr.net/npm/node-forge@0.7.0/dist/forge.min.js',
	// https://github.com/digitalbazaar/forge
	function(contents) {
		crawler.forge = require(crawler.main_directory + 'forge.min.js');
		if (false) {
			var hash = crawler.forge.md.md5.create();
			hash.update('text');
			hash = hash.digest().toHex();
			console.log(hash);
		}
		start_crawler(crawler, typeof module === 'object' && module);
	}, {
		directory : crawler.main_directory
	});
}
