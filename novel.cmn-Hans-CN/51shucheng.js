/**
 * 批量下載 无忧书城 的工具。 Download 51shucheng.net novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB' ]);

// ----------------------------------------------------------------------------

var PATTERN_attributes = /([^：<>]+)：[\s\n]*(<a.+?<\/a>|.+?)(?:&nbsp;|\s)/g,
//
crawler = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。default:false
	// recheck='changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。否則只會自上次下載過的章節接續下載。
	recheck : 'changed',

	site_name : '无忧书城',
	base_URL : 'https://www.51shucheng.net/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search?q=',
	parse_search_result : function(html, get_label) {
		html = html.between('<div class="search_result">').between('<ul',
				'</ul>');
		// console.log(html);
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [];

		html.each_between('<li>', '</li>', function(text) {
			// 從URL網址中解析出作品id。
			var matched = text.match(
			//
			/<a [^<>]*?href="https?:\/\/[^\/]+\/([^<>"]+)" title="([^<>"]+)"[^<>]*>/
			//
			);
			if (matched[1].split('/').length !== 2)
				return;
			id_list.push(matched[1].replace('/', '_'));
			id_data.push(get_label(matched[2]).replace('小说全集在线阅读', ''));
		});

		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return work_id.replace('_', '/');
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// console.log(html);

		var text = html.between('<div class="catalog">',
				'<div class="mulu-title">'),
		//
		work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(text.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			description : get_label(text.between('<div class="intro">',
					'</div>').between('>'))
		};

		extract_work_data(work_data, text.between('<div class="info">',
				'</div>'), PATTERN_attributes);

		work_data.author = work_data.作者;
		work_data.tags = [ work_data.所属类目 ];

		// console.log(work_data);
		return work_data;
	},
	// 對於章節列表與作品資訊分列不同頁面(URL)的情況，應該另外指定.chapter_list_URL。
	get_chapter_list : function(work_data, html, get_label) {
		if (work_data.last_update) {
			CeL.debug('work_data.last_update setted: ' + work_data.last_update,
					1, 'get_chapter_list');
			return;
		}

		// console.log(html);
		var crawler = this;
		html = html.each_between('<div class="mulu-title">', null, function(
				text) {
			var part_title = text.between('<h2>', '</h2>');
			crawler.set_part(work_data, part_title);
			text.between('<ul>', '</ul>')
			//
			.each_between('<li>', '</li>', function(text) {
				var matched = text
				//
				.match(/<a href="([^<>"]+)"[^<>]*>(.+)<\/a>/);
				var chapter_data = {
					title : get_label(matched[2]),
					url : matched[1]
				};
				crawler.add_chapter(work_data, chapter_data);
			});
		});

		// console.log(work_data.chapter_list);

		// --------------------------------------

		var last_chapter = work_data.chapter_list
		//
		[work_data.chapter_list.length - 1];
		// console.log(last_chapter);
		return new Promise(function(resolve, reject) {
			crawler.get_URL(last_chapter.url, function(XMLHttp) {
				// console.log(XMLHttp);
				var html = XMLHttp.responseText;
				var matched = html.match(/发布时间：([^<>]+)/);
				work_data.last_update = matched[1].trim();
				// console.log(work_data);
				resolve();
			}, {
				onerror : reject
			});
		});
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// <div class="content book-content">
		html = html.between('<div class="content') || html;
		// console.log(html);

		// 在取得小說章節內容的時候，若發現有章節被目錄漏掉，則將之補上。
		this.check_next_chapter(work_data, chapter_NO, html
				.between('<div class="next">'), /下一章：<a .*?href="([^<>"]+)"/);

		var chapter_data = work_data.chapter_list[chapter_NO - 1];

		var text = html.between('<div class="info">', ' id="neirong">');
		var matched;
		while (matched = PATTERN_attributes.exec(text)) {
			// console.log(matched.slice(1));
			chapter_data[get_label(matched[1])] = get_label(matched[2]);
		}
		// console.log(chapter_data);

		this.add_ebook_chapter(work_data, chapter_NO, {
			title : chapter_data.part_title,
			sub_title : get_label(html.between('<h1>', '</h1>'))
					|| chapter_data.title,
			date : chapter_data.发布时间,
			text : html.between(' id="neirong">', '</div>').replace(
					/<(script|ins)[\s\S]+?<\/\1>[\n\s]*/g, '')
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(6);

start_crawler(crawler, typeof module === 'object' && module);
