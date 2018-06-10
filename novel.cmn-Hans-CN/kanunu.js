/**
 * 批量下載 卡努努书坊 的工具。 Download kanunu novels.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// CeL.detect_HTML_language()
, 'application.locale' ]);

// ----------------------------------------------------------------------------

// <table cellspacing="1" cellpadding="[89]" width="(650|800)" align="center"
// bgcolor="#d4d0c8" border="0">
var PATTERN_work = /<(h[12])>(.+?)<\/\1>([\s\S]+?)\n<\/table>\s*<table[^<>]*>([\s\S]+?)<\/table>/i,
//
PATTERN_chapter_text = /<td width="880" height="60" align="center" bgcolor="#FFFFFF">([\s\S]+?)<\/td>[\s\S]+?<\/table>\s*<table[^<>]*>([\s\S]+?)<\/table>/,
//
PATTERN_AD = /<script [^<>]*src="[^<>"]+"[^<>]*><\/script>/g,
//
crawler = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。default:false
	// recheck='changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。否則只會自上次下載過的章節接續下載。
	recheck : 'changed',
	charset : 'gbk',

	site_name : '努努书坊',
	base_URL : 'https://www.kanunu8.com/',

	// 規範 work id 的正規模式；提取出引數（如 URL）中的作品id 以回傳。
	extract_work_id : function(work_information) {
		return /^(?:[a-z\d]+\/)+\d+\/?$/.test(work_information)
				&& !work_information.includes('writer/')
				&& !work_information.startsWith('author')
				&& !work_information.startsWith('zj/') && work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	// baidu_cse : '10043891704509466388',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		work_id = work_id.replace(/#/g, '/');
		if (!work_id.endsWith('/')) {
			// e.g., https://www.kanunu8.com/wuxia/201102/1610.html
			work_id += '.html';
		} else {
			// https://www.kanunu8.com/book3/7721/index.html
			// https://www.kanunu8.com/book3/8257/index.html
			// work_id += 'index.html';
		}
		return work_id;
	},
	parse_work_data : function(html, get_label, exact_work_data) {
		// console.log(html);

		var text = html.match(PATTERN_work), matched = text[3].match(
		//
		/[\s>](?:来源[：:]([^<>]+?))?作者[：:]([^<>]+?)发布时间[：:]([^<>]+)/),
		//
		work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(text[2]),
			author : matched[2]
			// e.g., [美]斯蒂芬妮·梅尔
			.replace(/^\s*\[.\]/, '').trim(),
			last_update : matched[3].trim(),

			// 選擇性屬性：須配合網站平台更改。
			chapter_html : text[4],
			// 自行指定作品放置目錄與 ebook 用的 work id。
			directory_id : function() {
				return this.id.match(/([\d]+)\/?$/)[1];
			}
		};

		// 由 meta data 取得作品資訊。
		exact_work_data(work_data, html);

		matched = text[3].between('<tr align="left">', '</tr>').trim().match(
		//
		/^(?:<td[^<>]*>([\s\S]+?)<\/td>\s*)?<td[^<>]*>([\s\S]+?)<\/td>$/);
		if (matched) {
			if (matched[1]) {
				matched[1] = matched[1].match(/<img [^<>]*src="([^<>"]+)"/);
				if (matched[1]) {
					work_data.image = this.base_URL + matched[1][1];
				}
			}
			work_data.description = get_label(matched[2]).replace(
					/^内容简介[：:]\s*/, '');
		} else {
			CeL.log(work_data.title + ': 本書沒有內容簡介文字。');
		}

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		// console.log(html);
		var chapter_html = work_data.chapter_html,
		//
		part_title, chapter_text, matched,
		//
		base_URL = this.work_URL(work_data.id).replace(/[^\/]+$/, ''),
		//
		PATTERN_chapter = /<td[^<>]*>([\s\S]+?)<\/td>/g;
		delete work_data.chapter_html;

		work_data.chapter_list = [];
		while (chapter_text = PATTERN_chapter.exec(chapter_html)) {
			chapter_text = chapter_text[1];
			matched = chapter_text.match(/<a href="([^<>"]+)+">([^<>]+)/);
			// console.log(matched || chapter_text);
			if (matched) {
				var chapter_data = {
					title : get_label(matched[2]),
					url : base_URL + matched[1]
				};
				if (part_title) {
					chapter_data.part_title = part_title;
				}
				work_data.chapter_list.push(chapter_data);
			} else {
				chapter_text = get_label(chapter_text);
				if (chapter_text && chapter_text !== '正文') {
					part_title = chapter_text;
				}
			}
		}
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// 在取得小說章節內容的時候，若發現有章節被目錄漏掉，則將之補上。
		// this.check_next_chapter(work_data, chapter_NO, html);

		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		//
		text = html.match(PATTERN_chapter_text);

		this.add_ebook_chapter(work_data, chapter_NO, {
			title : chapter_data.part_title,
			sub_title : get_label(text[1]) || chapter_data.title,
			// date : work_data.last_update,
			text : text[2].replace(/<\/?t[dr][^<>]*>/g, '')
			// 去除掉廣告。
			.replace(PATTERN_AD, '')
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(6);

start_crawler(crawler, typeof module === 'object' && module);
