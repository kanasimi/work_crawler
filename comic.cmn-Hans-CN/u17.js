/**
 * 批量下載 有妖气原创漫画梦工厂 漫畫 的工具。 Download u17 comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

// [ all, chapter id, url, title + date, class="pay_chapter", short title, page
// count ]
var PATTERN_chapter = /<a id="cpt_(\d+)" href="([^<>"]+)"[\n\s]+title="([^<>"]+)"([^<>]*)>([\s\S]+?)<\/a>([\s\S]*?)<\/li>/g,
//
crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 圖像檔案下載失敗處理方式：忽略/跳過圖像錯誤。當404圖像不存在、檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。default:false
	skip_error : true,

	// one_by_one : true,
	base_URL : 'http://www.u17.com/',

	// https://github.com/kanasimi/work_crawler/issues/250
	// png: 97661 破例婚约（全彩）
	// gif:
	acceptable_types : 'png|gif',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'www/ajax.php?mod=comic&act=comic_suggest&q=',
	parse_search_result : function(html) {
		var id_list = [], id_data = [];
		html = JSON.parse(html);

		html.forEach(function(work_data) {
			id_list.push(work_data.comicId);
			id_data.push(work_data.comicName);
		});

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'comic/' + work_id + '.html';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var text = html.between('<div class="comic_info">',
				'<div class="chapterlist">'), matched,
		//
		PATTERN_tags = /static\.u17i\.com\/[^<>"]+" title="([^<>"]+)"/g,
		//
		work_data = {
			author : get_label(text
			//
			.between('<div class="author_info">', '<p>')),
			// 更新頻率
			update_frequency : get_label(text.between('<i class="sign', '</i>')
					.between('>')),
			tags : [],
			last_update : get_label(html.between('最后更新时间：', '<'))
		};
		eval(html.match(/var comic_id[^\r\n]+(?:\r?\n\s*var [^\r\n]+)+/)[0]
		// must fit 镇魂街, 雏蜂, 战国千年
		.replace(/var /g, 'work_data.').replace(/=\s*_?cfg_host_base/,
				'=work_data.cfg_host_base||' + JSON.stringify(this.base_URL)));

		while (matched = PATTERN_tags.exec(text)) {
			work_data.tags.push(matched[1]);
		}

		PATTERN_tags = /class="class_tag">([^<>"]+)/g;

		while (matched = PATTERN_tags.exec(text)) {
			work_data.tags.push(matched[1]);
		}

		extract_work_data(work_data, html);

		extract_work_data(work_data, text,
		// e.g., "<div class="comic_infor_status">状态：<span
		// class="color_green">连载中</span></div>"
		/class="comic_infor_status">([^<>]+)<span[^<>]+>([^<>]+)<\/span>/g);

		extract_work_data(work_data, text.between('<div class="pop_box">',
				'</div>'),
		// e.g., "<span>总月票：<em>446</em></span>"
		/<span>([^<>]+)<em>([^<>]+)<\/em><\/span>/g);

		Object.assign(work_data, {
			title : work_data.comic_name,
			status : work_data.状态,
			作品简介 : get_label(html.between('<p class="ti2">', '</p>'))
		});

		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between('<div class="chapterlist">', '</ul>');
		work_data.chapter_list = [];

		var matched;
		// [ all, chapter id, url, title + date, pay_chapter,
		// short title, page count ]
		while (matched = PATTERN_chapter.exec(html)) {
			matched[3] = get_label(matched[3]);
			matched[6] = get_label(matched[6]);
			var title_date = matched[3].match(/^(.+)\s(\d{4}-\d{2}-\d{2})$/),
			//
			chapter_data = {
				// 採用呼叫網頁的方法，有些頁面無圖片資料。
				// url : matched[2],
				// 採用呼叫API的方法。
				url : 'comic/ajax.php?mod=chapter'
						+ '&act=get_chapter_v5&chapter_id=' + matched[1],
				title : (title_date ? title_date[1].trim() : matched[3])
				// e.g., "(9p)"
				+ (matched[6] ? ' ' + matched[6] : ''),
				limited : matched[4].includes('pay_chapter')
			};
			if (chapter_data.limited)
				work_data.some_limited = true;
			if (title_date) {
				chapter_data.date = title_date[2];
			}
			work_data.chapter_list.push(chapter_data);
		}
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data;

		if (html.startsWith('{')) {
			// 採用呼叫API的方法。
			chapter_data = JSON.parse(html);
			if (!chapter_data.image_list && chapter_data.message) {
				CeL.error(work_data.title + ' #' + chapter_NO + ': '
				// e.g., "没有阅读权限"。2019/8 時，無 `chapter_data.chapter`。
				+ chapter_data.message);
			} else {
				chapter_data.image_list.forEach(function(image_data) {
					image_data.url = image_data.src;
					// 正常圖片起頭如 'http://img6.u17i.com/'
					// 有問題的mask圖片起頭為 'http://cover.u17i.com/image_mask/'
					if (image_data.url.includes('/image_mask/')) {
						image_data.is_bad = 'masked';
					}
				});
			}

		} else if (chapter_data = html.between('image_config =', '\nvar')) {
			// 採用呼叫網頁的方法，有些頁面無圖片資料。
			eval('chapter_data=' + chapter_data);

			(chapter_data.image_list = Object.values(chapter_data.image_list))
			//
			.forEach(function(image_data) {
				image_data.url = atob(image_data.src);
			});

		} else {
			throw new Error('網站結構改變，無法取得資料！請回報此項錯誤。');
		}

		// type: '0','3': OK, '4': masked
		if (!chapter_data.chapter || +chapter_data.chapter.type === 4)
			chapter_data.limited = true;
		// console.log(chapter_data);
		return chapter_data;
	},

	/**
	 * 處理特殊圖片: u17免費章節會下載到模糊圖片。
	 */
	is_limited_image_url : function(image_url) {
		return image_url.endsWith('_seal.jpg');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
