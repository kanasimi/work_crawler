/**
 * 批量下載 全本小说网 小说 的工具。 Download quanben novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// CeL.detect_HTML_language()
, 'application.locale' ]);

// ----------------------------------------------------------------------------

// https://www.cnblogs.com/niemx1030/p/12196462.html
function base64(_str) {
	var staticchars = "PXhw7UT1B0a9kQDKZsjIASmOezxYG4CHo5Jyfg2b8FLpEvRr3WtVnlqMidu6cN";
	var encodechars = "";
	for (var i = 0; i < _str.length; i++) {
		var num0 = staticchars.indexOf(_str[i]);
		if (num0 == -1) {
			var code = _str[i]
		} else {
			var code = staticchars[(num0 + 3) % 62]
		}
		var num1 = parseInt(Math.random() * 62, 10);
		var num2 = parseInt(Math.random() * 62, 10);
		encodechars += staticchars[num1] + code + staticchars[num2]
	}
	return encodechars
}

var crawler = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。default:false
	// recheck='changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。否則只會自上次下載過的章節接續下載。
	// recheck : 'changed',

	// 下載每個作品更換一次 user agent。
	// regenerate_user_agent : 'work',

	// 2023/8/21 前: https://www.quanben5.com/
	base_URL : 'https://www.quanben5.com/',

	// chapter_time_interval : '6s',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title, get_label) {
		var search_URL = new CeL.URI(this.base_URL)
		Object.assign(search_URL.search_params, {
			// @see function load_more()
			c : 'book',
			a : 'search.json',
			callback : 'search',
			t : Date.now(),
			keywords : work_title,
			b : base64(encodeURI(work_title))
		});

		return [ search_URL, null, {
			headers : {
				Referer : this.base_URL + 'search.html'
			}
		} ];
	},
	parse_search_result : function(html, get_label) {
		html = JSON.parse(html.between('search(', {
			tail : ')'
		}));
		html = html.content;
		// console.log(html);
		var id_list = [], id_data = [];
		html.each_between('<div class="pic">', null,
		//
		function(text) {
			id_list.push(text.between('<a href="/n/', '/">'));
			id_data.push(get_label(text.between('<h3>', '</h3>')));
		});
		// console.trace(id_list, id_data);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'n/' + work_id + '/xiaoshuo.html';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		if (!this.site_name) {
			// <div class="footer"><p
			// class="tc"><strong>全本小说网</strong></p></div>
			this.site_name = get_label(html.between('<p class="tc">', '</p>'));
		}

		var text = html.between('<h2 class="title"><span>书籍</span></h2>',
				'<div class="box">');
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			description : get_label(html.between(' class="description">',
					'</p>')),
			image : text.between(' src="', '"')
		};

		text.each_between('<p class="info">', '</p>', function(_text) {
			var matched = _text.match(/([^<>]+)<span[^<>]*>([^<>]+)/);
			// console.log(matched || _text);
			if (matched) {
				work_data[get_label(matched[1].replace(/:[\s\S]*$/g, ''))]
				//
				= get_label(matched[2]) || '';
			}
		});

		// 由 meta data 取得作品資訊。
		extract_work_data(work_data, html);

		work_data = Object.assign({
			// 選擇性屬性：須配合網站平台更改。
			status : work_data.状态,
			author : work_data.作者,
			tags : work_data.类别
		}, work_data);

		// console.log(html);
		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html
		// <h2 class="title"><span>书籍</span></h2>
		.between('<div class="box">')
		// <h2 class="title"><span>正文</span></h2>
		.between('<div class="box">');

		work_data.chapter_list = [];

		html.each_between('<h2 class="title">', null, function(text) {
			// console.log(text);
			var part_title = get_label(text.between(null, '</span>'));
			if (part_title === '正文')
				part_title = '';

			// <ul class="list"><li class="c3"><a
			// href="/n/daoguiyixian/1.html"><span>第一章 师傅</span></a></li><li
			// class="c3"><a href="/n/daoguiyixian/2.html"><span>第二章
			// 李火旺</span></a></li>
			// ...
			// </li></ul>
			text.each_between('<li class="c3">', '</li>', function(_text) {
				// console.log(_text);
				var chapter_data = {
					url : _text.between('<a href="', '"'),
					part_title : part_title,
					title : get_label(_text.between('<span>', '</span>')),
				};
				work_data.chapter_list.push(chapter_data);
			});

		});
		// console.log(work_data);
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);
		// 在取得小說章節內容的時候，若發現有章節被目錄漏掉，則將之補上。
		this.check_next_chapter(work_data, chapter_NO, html);

		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		//
		text = html.between('<div id="content">', '</div>');

		text = text.replace(/(空|浩浩|坦坦)\*{2,}/g, '$1荡荡');

		this.add_ebook_chapter(work_data, chapter_NO, {
			title : chapter_data.part_title,
			sub_title : chapter_data.title
			// <h1 class="title1">第一章 师傅</h1>
			|| get_label(html.between('<h1 class="title1">', '</h1>')),
			text : text
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
