/**
 * 批量下載 禁漫天堂 的工具。 Download 18comic comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// one_by_one : true,
	// https://18comic.org/
	base_URL : 'https://18comic.vip/',

	// one_by_one : true,

	// 最小容許圖案檔案大小 (bytes)。
	// 對於極少出現錯誤的網站，可以設定一個比較小的數值，並且設定.allow_EOI_error=false。因為這類型的網站要不是無法取得檔案，要不就是能夠取得完整的檔案；要取得破損檔案，並且已通過EOI測試的機會比較少。
	// 對於有些圖片只有一條細橫桿的情況。
	// MIN_LENGTH : 150,

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// e.g., 与学姐的那些事
	skip_error : true,

	// acceptable_types : 'png',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search/photos?main_tag=0&search_query=',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		var
		// {Array}id_list = [ id, id, ... ]
		id_list = [],
		// {Array}id_data = [ title, title, ... ]
		id_data = [];

		html.each_between('<div class="well well-sm">', null, function(token) {
			var id = token.between('<a href="/album/', '/');
			// work_id 包含擷取作品名稱的情況:
			// id = token.between('<a href="/album/', '"').replace('/', '-');
			if (!id)
				return;
			id_list.push(id);
			id_data.push(token.between('alt="', '"'));
		});
		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return '/album/' + work_id;
		// work_id 包含擷取作品名稱的情況:
		// return '/album/' + encodeURIComponent(work_id).replace('-', '/');
	},
	parse_work_data : function(html, get_label, extract_work_data, options) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between(
					'<div itemprop="name" class="pull-left">', '</div>')),

			// 選擇性屬性：須配合網站平台更改。
			status : []
		};

		html = html.between(null, '<a id="related_comics_a" ');
		html.each_between('<div class="tag-block">', null, function(token) {
			var matched = token.match(/^([^<>]+?)[：:]([\s\S]+)$/);
			if (matched)
				work_data[get_label(matched[1])] = get_label(matched[2]);
		});

		html.each_between('<div class="p-t-5 p-b-5"', '</div>',
		//
		function(token) {
			token = token.between('>');
			var matched = token.match(/^([^<>]+?)[：:]([\s\S]+)$/);
			if (matched)
				work_data[get_label(matched[1])] = get_label(matched[2]);
			else
				work_data.status.push(get_label(token).replace(/\n\s*/g, ' '));
		});

		Object.assign(work_data, {
			author : work_data.作者.replace(/\n\s*/g, ' '),
			last_update : work_data.更新日期,
			description : work_data.敘述
		});

		// work_id 包含擷取作品名稱的情況:
		if (false) {
			// 允許自訂作品目錄名/命名資料夾。
			// console.log([ options.id, work_data.title ]);
			// 由於 work id 已經包含作品名稱，因此不再重複作品名稱部分。
			work_data.directory_name = options.id.match(/^[^-]+/)[0] + ' '
					+ work_data.title;
		}

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between(null, '<a id="related_comics_a" ');

		work_data.chapter_list = [];

		var text = html.between('<ul class="btn-toolbar', '</ul>');
		if (!text) {
			work_data.chapter_list.push({
				url : html.between(' reading" href="', '"')
			});
			return;
		}

		text.each_between('<a href="', '</a>',
		//
		function(token) {
			work_data.chapter_list.push({
				title : get_label(token.between('>', '<span ')).replace(
						/\n\s*/g, ' '),
				url : token.between(null, '"'),
				date : token.between(
						'<span class="hidden-xs" style="float: right;">',
						'</span>')
			});
		});
		// console.log(work_data);
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);
		var chapter_data = Object.assign(
		//
		work_data.chapter_list[chapter_NO - 1], {
			image_list : []
		});
		html = html.between('<div class="panel-body">',
				'<ul class="nav nav-tabs">');
		html.each_between('<img ', '>', function(token) {
			var url = token.between(' data-original="', '"')
					|| token.between(' src="', '"');
			if (url.startsWith('/static')) {
				// 廣告
				// e.g., <img alt=""
				// src="/static/resources/images/MAFIA-956-264.png"
				// style="width: 956px; height: 264px;" />
				return;
			}
			chapter_data.image_list.push({
				url : url
			});
		});

		return chapter_data;
	},

	image_preprocessor : function(contents, image_data) {
		if (!contents)
			return contents;

		var index = contents.length, code_0 = '0'.charCodeAt(0), code_9 = '9'
				.charCodeAt(0);

		while (--index > 0 && contents.length - index < 9
		// 修正圖片結尾非正規格式之情況。
		&& contents[index] >= code_0
		// 不知為何，cloudflare 每次取得圖片都會隨機添加一串五或六位數的數字。只好手動去除。
		&& contents[index] <= code_9)
			;

		return contents.slice(0, index + 1);
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
