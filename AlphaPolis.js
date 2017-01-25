/**
 * 批量下載アルファポリス - 電網浮遊都市 - 小説的工具。 Download AlphaPolis novels.
 */

'use strict';

require('./comic loder.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB', 'data.character' ]);

var charset = 'EUC-JP', node_fs = require('fs');
CeL.character.load(charset);

var AlphaPolis = new CeL.comic.site({
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,
	// one_by_one : true,
	base_URL : 'http://www.alphapolis.co.jp/',
	charset : charset,

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return [ this.base_URL + 'top/search/', {
			// 2: 小説
			'data[tab]' : 2,
			'data[refer]' : work_title
		} ];
	},
	parse_search_result : function(html) {
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [], get_next_between = html.all_between('<h3 class="title">',
				'</a>'), text;
		while ((text = get_next_between()) !== undefined) {
			id_list.push(+text.between(' href="/content/cover/', '/"'));
			id_data.push(text.between('>'));
		}
		return [ id_list, id_data ];
	},
	// id_of_search_result : function(cached_data) { return cached_data;
	// },
	// title_of_search_result : function(data) { return data; },

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return this.base_URL + 'content/cover/' + (work_id | 0);
	},
	parse_work_data : function(html, get_label) {
		// work_data={id,title,author,authors,chapter_count,last_update,last_download:{date,chapter}}
		return {
			// 必要屬性：須配合網站平台更改。
			title : html.between('"og:title" content="', '"'),

			// 選擇性屬性：須配合網站平台更改。
			// e.g., "连载中"
			status : get_label(
					html.between('<div class="category novel_content">',
							'</div>')).replace(/[\s\n]+/g, ','),
			author : get_label(html.between('<div class="author">', '</a>')),
			description : get_label(html.between('"og:description" content="',
					'"')),
			last_update : get_label(html.between('<th>更新日時</th>', '</td>'))
		};
	},
	get_chapter_count : function(work_data, html) {
		html = html.between('<div class="toc cover_body">',
				'<div class="each_other_title">');
		work_data.chapter_list = [];
		var get_next_between = html.all_between('<li', '</li>'), text;
		while ((text = get_next_between()) !== undefined) {
			work_data.chapter_list.push({
				url : text.between('<a href="', '"'),
				date : text.between('<span class="open_date">', '</span>'),
				title : text.between('<span class="title">', '</span>')
			});
		}
		work_data.chapter_count = work_data.chapter_list.length;

		work_data.ebook = new CeL.EPUB(work_data.directory
				+ work_data.directory_name, {
			identifier : work_data.id,
			title : work_data.title,
			language : 'ja-JP'
		});
		// http://www.idpf.org/epub/31/spec/epub-packages.html#sec-opf-dcmes-optional
		work_data.ebook.set({
			creator : work_data.author,
			// 出版時間 the publication date of the EPUB Publication.
			date : CeL.EPUB.date_to_String(work_data.last_update.to_Date({
				zone : 9
			})),
			subject : work_data.status,
			description : work_data.description,
			publisher : 'アルファポリス (' + this.base_URL + ')',
			source : work_data.url
		});
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter) {
		return work_data.chapter_list[chapter - 1].url;
	},
	parse_chapter_data : function(html, work_data, get_label, chapter) {
		chapter = get_label(html.between(
				'<div class="total_content_block_count">', '/'));
		var text = html.between('<div class="text', '</div>').between('>');
		text = text.replace(/\r/g, '')
		// .replace(/<br \/>\n/g, '\n')
		.trim() + '\n';
		// text = text.replace(/\n/g, '\r\n')

		var title = get_label(html.between('<div class="chapter_title">',
				'</div>')),
		//
		sub_title = get_label(html.between('<h2>', '</h2>'));
		work_data.ebook.add(chapter.pad(3) + ' ' + title + ' - ' + sub_title
				+ '.xhtml',
		//
		'<?xml version="1.0" encoding="UTF-8"?>' + '<!DOCTYPE html>'
		//
		+ '<html xmlns="http://www.w3.org/1999/xhtml">' + '<head></head><body>'
		// + '<div style="float:right">' + chapter + '</div>'
		+ '<h2>' + title + '</h2>'
		//
		+ '<h3>' + sub_title + '</h3>'
		//
		+ '<div class="text">' + text + '</div></body></html>');
	},
	finish_up : function(work_data) {
		work_data && work_data.ebook.flush();
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

AlphaPolis.start(work_id);
