/**
 * 批量下載稻草人书屋的工具。 Download daocaoren shuwu novels.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.storage.EPUB');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。default:false
	// recheck='changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。否則只會自上次下載過的章節接續下載。
	recheck : 'changed',

	base_URL : 'http://www.daocaorenshuwu.com/',

	// 規範 work id 的正規模式；提取出引數（如 URL）中的作品id 以回傳。
	extract_work_id : function(work_information) {
		return /^[a-z_\d]+$/.test(work_information) && work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'plus/search.php?q=',
	parse_search_result : function(html, get_label) {
		var id_list = [], id_data = [];
		html.each_between('<tr>', '</tr>', function(text) {
			var id = text.between(' href="/book/', '/');
			if (id) {
				id_list.push(id);
				id_data.push(get_label(text.between(' title="', '"')));
			}
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'book/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var data = html.between('<div class="book-info">',
				'<div class="chapter">'),
		//
		work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(data.between('<h1 class="book-name">', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			description : get_label(data.between('<div class="book-detail">',
					'</div>')),
			image : this.base_URL
					+ data.between('<img class="book-img-middel" src="', '"')
							.replace(/^\//, ''),
			last_update : data.between(
					'<div class="col-md-4 col-sm-6 dark hidden-sm hidden-xs">',
					'</div>'),
			site_name : get_label(html.between('<div class="logo fl">',
					'</div>'))
		};
		extract_work_data(work_data, data,
		// e.g., "<p>状态：已完结</p>"
		/<div class="[^<>"]*?col-sm-6 dark[^<>"]*?">([^：]+)：(.+?)<\/div>/g);

		Object.assign(work_data, {
			author : work_data.作者,
			status : [ work_data.状态, work_data.类型 ],
			latest_chapter : work_data.最新章节
		});

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		work_data.chapter_list = [];

		html = html.between('<div id="all-chapter">',
				'<!-- All Chapterlist End -->');

		var part_title, matched,
		//
		PATTERN_chapter = /<a href="([^"<>]+)" title="([^"<>]+)"/g;

		while (matched = PATTERN_chapter.exec(html)) {
			// console.log(matched);
			var chapter_data = {
				url : matched[1],
				title : matched[2]
			};
			work_data.chapter_list.push(chapter_data);
		}
	},

	// 取得每一個章節的內容與各個影像資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// 在取得小說章節內容的時候，若發現有章節被目錄漏掉，則將之補上。
		this.check_next_chapter(work_data, chapter_NO, html,
		// PATTERN_next_chapter: [ all, next chapter url ]
		/<a [^<>]*?href="([^"]+.html)"[^<>]*><button[^<>]*>下一[章页][：: →]*/);

		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		//
		text = html.between('<div id="cont-text" class="cont-text">',
				'<div class="page">');
		text = text.between(null, '<div class="clear">') || text;
		text = text.between(null, {
			tail : '</div>'
		}).replace(
		// 去除廣告
		/<(i|p|span) class='[a-z]{3}\d{3}'>[^<>]{0,30}<\/\1>/ig, '');

		this.add_ebook_chapter(work_data, chapter_NO, {
			sub_title : get_label(html.between('<h1 class="cont-title">',
					'</h1>')),
			date : html.between(
					'<i class="fa fa-clock-o" aria-hidden="true"></i>', '</a>')
					.trim(),
			text : text
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
