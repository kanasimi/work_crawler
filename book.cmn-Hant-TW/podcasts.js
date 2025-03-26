/**
 * 批量下載 podcasts 小说 的工具。 Download Apple Podcast.
 * 
 * 2024/8/19-20 網頁改版。 https://www.solidot.org/story?sid=79024
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// CeL.detect_HTML_language()
, 'application.locale' ]);

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。default:false
	// recheck='changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。否則只會自上次下載過的章節接續下載。
	// recheck : 'changed',

	// search_work_interval : '2s',
	// chapter_time_interval : '2s',

	site_name : 'Podcast',

	base_URL : 'https://podcasts.apple.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'tw/search?term=',
	parse_search_result : function(html, get_label) {
		html = html.between(
				'<script type="application/json" id="serialized-server-data">',
				'</script>');
		// console.log(html);
		html = JSON.parse(html);
		// console.log(html);
		var items;
		html = html[0].data.shelves.some(function(shelf) {
			if (shelf.title === '節目') {
				items = shelf.items;
				return true;
			}
		});

		var id_list = items.map(function(item) {
			return item.title + '-' + item.id;
		});

		// console.log(items);
		return [ id_list, items ];
	},
	title_of_search_result : 'title',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		var matched = work_id.match(/^(.+)-(\d+)$/);
		return 'tw/podcast/' + matched[1] + '/id' + matched[2];
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// console.trace(html);

		if (this.MEDIA_API_token) {
			return this._parse_work_data(html, get_label, extract_work_data);
		}

		var matched = html.match(
		//
		/<script [^<>]*?src="(\/assets\/index-[\da-f]+\.js)">/);
		// console.trace(matched);

		var _this = this;
		return new Promise(function(resolve, reject) {
			_this.get_URL(matched[1], function(XMLHttp, error) {
				// console.trace(XMLHttp, error);
				if (error) {
					reject(error);
					return;
				}

				try {
					var matched = XMLHttp.responseText
					// {268}
					.match(/\"([\d\w\-\.]{260,300})\"/);
					_this.MEDIA_API_token = matched[1];
					CeL.info('MEDIA_API_token: ' + _this.MEDIA_API_token);
				} catch (e) {
					reject(e);
					return;
				}

				resolve(_this._parse_work_data(html, get_label,
						extract_work_data));
			});
		});
	},
	_parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = JSON.parse(html.between(
				'<script id=schema:show type="application/ld+json">',
				'</script>'));

		// 由 meta data 取得作品資訊。
		// extract_work_data(work_data, html);

		// console.trace(work_data);

		var data = JSON.parse(html.between(
				'<script type="application/json" id="serialized-server-data">',
				'</script>'));
		// console.log(data);
		work_data['serialized-server-data'] = data;

		Object.assign(work_data, {
			// e.g.,
			// https://podcasts.apple.com/tw/podcast/%E4%B8%8B%E4%B8%80%E6%9C%AC%E8%AE%80%E4%BB%80%E9%BA%BC/id1532820533
			title : work_data.name.replace(/[‪‬]/g, ''),
			author : data[0].data.headerButtonItems[0].model.author
		});

		// console.log(html);
		// console.log(work_data);
		return work_data;
	},

	pre_get_chapter_list : function(callback, work_data, html, get_label) {

		// reset work_data.chapter_list
		work_data.chapter_list = [];

		// console.trace(work_data);

		var originaal_headers = crawler.get_URL_options.headers;
		// console.trace(crawler.get_URL_options.headers);
		crawler.get_URL_options.headers = Object.assign(Object
				.clone(crawler.get_URL_options.headers), {
			Origin : 'https://podcasts.apple.com',
			Authorization : 'Bearer ' + this.MEDIA_API_token,
			'Sec-Fetch-Site' : 'same-site'
		});
		// console.trace(crawler.get_URL_options.headers);

		function get_next_chapter_list_slice(episodes_data) {
			if (!episodes_data.next) {
				// recover
				crawler.get_URL_options.headers = originaal_headers;
				callback();
				return;
			}

			var matched = episodes_data.next.match(/offset=(\d+)/);
			CeL.log_temporary(work_data.title + ' ' + matched[0] + '...');
			episodes_url.search_params.offset = matched[1];
			crawler.get_URL(episodes_url, function(XMLHttp, error) {
				// console.trace(XMLHttp, error);
				var episodes_data = JSON.parse(XMLHttp.responseText);
				// console.trace(episodes_data);
				work_data.chapter_list.append(episodes_data.data);
				get_next_chapter_list_slice(episodes_data);
			});
		}

		var matched = work_data.id.match(/^(.+)-(\d+)$/);
		var episodes_url = CeL.URI(
		//
		'https://amp-api.podcasts.apple.com/v1/catalog/tw/podcasts/'
		//
		+ matched[2] + '/episodes?l=zh-Hant-TW&offset=0'
		//
		+ '&extend%5Bpodcast-channels%5D'
		//
		+ '=editorialArtwork%2CsubscriptionArtwork%2CsubscriptionOffers'
		//
		+ '&include=channel%2Cpodcast&limit=25&with=entitlements');
		get_next_chapter_list_slice({
			next : "offset=0"
		});

		// free
		matched = null;
	},
	get_chapter_list : function(work_data, html, get_label) {
		work_data.chapter_list.reverse();
		work_data.chapter_list.forEach(function(chapter_data) {
			chapter_data.title = chapter_data.attributes.name;
			chapter_data.url = chapter_data.attributes.url;
		});
		// console.log(work_data.chapter_list);
	},

	pre_parse_chapter_data
	// 執行在解析章節資料 process_chapter_data() 之前的作業 (async)。
	// 必須自行保證執行 callback()，不丟出異常、中斷。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		// console.trace(chapter_data);

		var directory = work_data.directory + 'media' + CeL.env.path_separator,
		//
		title = chapter_data.title,
		//
		url = decodeURI(chapter_data.attributes.assetUrl),
		//
		extension = url.match(/(\.[^.?]+)(?:\?.*)?$/)[1];

		var old_file_name = directory + CeL.to_file_name(title) + extension;

		var file_name = directory
		//
		+ chapter_NO.pad(work_data.chapter_NO_pad_digits || 4) + ' '
		//
		+ CeL.to_file_name(title) + extension;

		if (CeL.file_exists(old_file_name)) {
			CeL.move_file(old_file_name, file_name);
		}

		// console.trace({directory,title,url,extension});
		CeL.create_directory(directory);

		var matched = url.match(/https%3A%2F%2F[^?]+/);
		// 像《斐姨所思》需要此手段。但Google文件之類無法直接取得資源。
		if (matched && !/google/.test(matched[0])) {
			url = decodeURIComponent(matched[0]);
		}

		CeL.log_temporary('Fetching [' + file_name + '] (' + url + ')...');
		// CeL.set_debug(9);
		CeL.get_URL_cache(url, function(data, error) {
			callback();
		}, {
			file_name : file_name,
			encoding : undefined,
			get_URL_options : Object.assign({
				error_retry : this.MAX_ERROR_RETRY
			}, this.get_URL_options, {
				// 有些檔案比較大，必須花費比較多時間。
				timeout : 5 * 60 * 1000
			})
		});
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);

		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		var text = chapter_data.attributes.description.standard;

		this.add_ebook_chapter(work_data, chapter_NO, {
			title : chapter_data.title,
			date : html.between('<p class="post-byline">', '<').trim().replace(
					/^\d*$/, ''),
			text : text
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
