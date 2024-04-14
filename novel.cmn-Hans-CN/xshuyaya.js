/**
 * 批量下載丫丫电子书的工具。 Download xshuyaya novels.
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

	// site_name : '丫丫电子书',

	language : 'cmn-Hans-CN',

	// old: shuyaya.com
	// 2022/3/22: http://www.xshuyaya.net/
	// 2022/6/1: http://www.shuyy.cc/
	// 2022/6/21: http://www.shuyyw.com/
	// 2022/11/4前: http://www.shuyyw.cc/ → http://www.shuyy8.com/
	base_URL : 'http://www.shuyy8.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search?wd=',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [];

		html = html.between('<ul class="clearfix">', '</ul>');
		html.each_between('<li>', '</li>', function(text) {
			var matched = text.match(
			//
			/<a href="[^<>"]+\/book\/(\d+)\/"[^<>]*>(.+?)<\/a>/);
			if (matched) {
				id_list.push(matched[1]);
				id_data.push(matched[2]);
			}
		});

		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'book/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// <div class="logocss"><a href="/">丫丫电子书</a></div>
		this.site_name = get_label(html.between('<div class="logocss">',
				'</div>'));
		var text = html.between('<p class="author">', '</p>');
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			latest_chapter : get_label(html.between(
					'<div class="lastrecord">最新章节：', '</div>')),
			description : get_label(html.between('<div class="r_cons">内容简介:',
					'</div>')),
			image : html.between('<div class="con_limg">').between(
					'<img src="', '"')
		};

		// 由 meta data 取得作品資訊。
		extract_work_data(work_data, html);

		// console.log(text);
		extract_work_data(work_data, text,
				/([^<>：]+)：<span[^<>]+>([\s\S]*?)<\/span>/g);

		work_data = Object.assign({
			author : work_data.作者,
			tag : work_data.书本标签
		}, work_data);

		// console.log(html);
		// console.log(work_data);
		return work_data;
	},
	// 對於章節列表與作品資訊分列不同頁面(URL)的情況，應該另外指定.chapter_list_URL。
	chapter_list_URL : function(work_id) {
		return 'read/' + work_id + '/';
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between('<h1>');
		work_data.last_update = get_label(html.between('更新时间：', '</span>'));
		// reset work_data.chapter_list
		work_data.chapter_list = [];
		html.each_between('<div ', '</div>', function(text) {
			var part_title = text.between('<h2>', '</h2>');
			if (part_title && !part_title.includes('正文')) {
				crawler.set_part(work_data, part_title);
				return;
			}
			text = text.between('<ul>', '</ul>');
			if (!text)
				return;
			// console.log(text);
			text.each_between('<li>', '</li>', function(item) {
				var matched = item
						.match(/<a href="([^<>"]+)"[^<>]*>([\s\S]+?)<\/a>/);
				if (!matched)
					return;
				var chapter_data = {
					url : matched[1],
					title : get_label(matched[2])
				};
				crawler.add_chapter(work_data, chapter_data);
			});
		});
		// console.log(work_data.chapter_list);
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);
		// 在取得小說章節內容的時候，若發現有章節被目錄漏掉，則將之補上。
		this.check_next_chapter(work_data, chapter_NO, html);

		var text = html.between('<div id="content">', '</div>');
		// <div class="bzend"><span>本章结束</span>
		text = text.replace(/<div class="bzend"[\s\S]+/, '');

		text = CeL.work_crawler.fix_general_censorship(text);

		text = CeL.work_crawler.fix_general_ADs(text);

		this.add_ebook_chapter(work_data, chapter_NO, text);
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
