/**
 * 批量下載 podcasts 小说 的工具。 Download Apple Podcast.
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
	search_URL : function(key) {
		return 'https://www.apple.com/tw/search/' + key + '?src=globalnav';
	},
	parse_search_result : function(html, get_label) {
		html = html.between(' id="explore"');
		// console.log(html);
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [];

		html.each_between('<div class="rf-serp-product-description">', null,
		//
		function(text) {
			var matched = text.match(/\/podcast\/([^\/"]+)\/id(\d+)"/);
			if (!matched)
				return;
			var title_id = decodeURIComponent(matched[1]);
			id_list.push(title_id + '-' + matched[2]);
			var title = get_label(text.between(
					'<h2 class="rf-serp-productname">', '</h2>'));
			id_data.push(title);
			if (false && title_id !== title) {
				CeL.error('parse_search_result: Different title! '
						+ JSON.stringify(title) + ', '
						+ JSON.stringify(title_id));
			}
		});
		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		var matched = work_id.match(/^(.+)-(\d+)$/);
		return 'tw/podcast/' + matched[1] + '/id' + matched[2];
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// console.trace(html);
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			/**
			 * <code>
			<h2>最仙遊<span>文 / <a href="/fxnlist/虾写.html">虾写</a></span></h2>
			</code>
			 */
			title : get_label(html.between(
					'<span class="product-header__title"', '</span>').between(
					'>'))

		// 選擇性屬性：須配合網站平台更改。
		};

		// console.trace(text);
		Object.assign(work_data, JSON.parse(html.between(
		//
		'<script name="schema:podcast-show" type="application/ld+json">',
				'</script>')));
		// e.g.,
		// https://podcasts.apple.com/tw/podcast/%E4%B8%8B%E4%B8%80%E6%9C%AC%E8%AE%80%E4%BB%80%E9%BA%BC/id1532820533
		work_data.title = work_data.title.replace(/[‪‬]/g, '');

		// 由 meta data 取得作品資訊。
		// extract_work_data(work_data, html);

		// console.log(html);
		// console.log(work_data);
		return work_data;
	},

	pre_get_chapter_list : function(callback, work_data, html, get_label) {
		// <div class="catalog" id="catalog">
		// <h3>目录</h3>

		var episodes_data = html.between(
				' id="shoebox-media-api-cache-amp-podcasts">', '</script>');
		episodes_data = JSON.parse(episodes_data);
		episodes_data = episodes_data[Object.keys(episodes_data)[0]];
		episodes_data = JSON.parse(episodes_data);
		episodes_data = episodes_data.d;
		episodes_data = episodes_data[0];
		episodes_data = episodes_data.relationships.episodes;
		// console.trace(episodes_data);

		// reset work_data.chapter_list
		work_data.chapter_list = episodes_data.data;
		// console.log(work_data.chapter_list);

		// console.trace(work_data);
		var environment = html.between(
				'<meta name="web-experience-app/config/environment" content="',
				'"');
		environment = decodeURIComponent(environment);
		environment = JSON.parse(environment);
		// console.trace(environment);

		var originaal_headers = crawler.get_URL_options.headers;
		// console.trace(crawler.get_URL_options.headers);
		crawler.get_URL_options.headers = Object.assign(Object
				.clone(crawler.get_URL_options.headers), {
			Origin : 'https://podcasts.apple.com',
			Authorization : 'Bearer ' + environment.MEDIA_API.token,
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

			crawler.get_URL('https://amp-api.podcasts.apple.com'
					+ episodes_data.next, function(XMLHttp, error) {
				// console.trace(XMLHttp, error);
				var episodes_data = JSON.parse(XMLHttp.responseText);
				// console.trace(episodes_data);
				work_data.chapter_list.append(episodes_data.data);
				get_next_chapter_list_slice(episodes_data);
			});
		}

		get_next_chapter_list_slice(episodes_data);
		// free
		episodes_data = environment = null;
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
