/**
 * 批量下載小説家になろう/小説を読もう！的工具。 Download syosetu.com novels.
 */

'use strict';

require('./comic loder.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// .to_file_name()
, 'application.net',
// CeL.detect_HTML_language()
, 'application.locale' ]);

var syosetu = new CeL.comic.site({
	// recheck:從頭檢測所有作品之所有章節。
	// 'changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。
	recheck : 'changed',

	// one_by_one : true,
	base_URL : 'http://syosetu.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'http://yomou.syosetu.com/search.php?order=hyoka&word=',
	parse_search_result : function(html) {
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [], get_next_between = html.all_between(
				'<div class="novel_h">', '</a>'), text;
		while ((text = get_next_between()) !== undefined) {
			id_list.push(
			//
			text.between(' href="http://ncode.syosetu.com/', '/"'));
			id_data.push(text.between('/">'));
		}
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'http://ncode.syosetu.com/novelview/infotop/ncode/' + work_id
				+ '/';
	},
	parse_work_data : function(html, get_label) {
		var work_data = CeL.null_Object(), text, get_next_between
		//
		= html.between('<table', '<div id="ad_s_box">').all_between('<tr>',
				'</tr>');

		while ((text = get_next_between()) !== undefined) {
			work_data[get_label(text.between('<th', '</th>').between('>'))]
			//
			= get_label(text.between('<td', '</td>').between('>'));
		}

		work_data = Object.assign({
			// 必要屬性：須配合網站平台更改。
			title : html.between('dc:title="', '"'),

			// 選擇性屬性：須配合網站平台更改。
			// e.g., 连载中, 連載中
			// <span id="noveltype">完結済</span>全1部
			// <span id="noveltype_notend">連載中</span>全1部
			status : [ html.between('<span id="noveltype', '<').between('>') ]
					.append(work_data.ジャンル.split(/\s+/)).append(
							work_data.キーワード.split(/\s+/)),
			author : work_data.作者名,
			last_update : work_data.最終話掲載日,
			description : work_data.あらすじ,
			site_name : '小説家になろう'
		}, work_data);

		work_data.status = work_data.status.filter(function(item) {
			return !!item;
		}).join(',');

		return work_data;
	},
	// 對於章節列表與作品資訊分列不同頁面(URL)的情況，應該另外指定.chapter_list_URL。
	chapter_list_URL : function(work_id) {
		return 'http://ncode.syosetu.com/' + work_id + '/';
	},
	get_chapter_count : function(work_data, html) {
		// TODO: 對於單話，可能無目次。

		// e.g., 'ja-JP'
		var language = CeL.detect_HTML_language(html);
		html = html.between('<div class="index_box">',
				'<div id="deqwas-collection-k">');
		work_data.chapter_list = [];
		var get_next_between = html.all_between('<dl class="novel_sublist2">',
				'</dl>'), text;
		while ((text = get_next_between()) !== undefined) {
			// [ , href, inner ]
			var matched = text
					.match(/ href="\/[^\/]+\/([^ "<>]+)[^<>]*>(.+?)<\/a>/);
			if (!matched) {
				throw text;
			}

			var chapter_data = {
				url : matched[1].replace(/^\.\//, ''),
				date : [ text.match(/>\s*(2\d{3}年[^"<>]+?)</)[1]
				//
				.to_Date({
					zone : 9
				}) ],
				title : matched[2]
			};
			if (matched = text.match(/ title="(2\d{3}年[^"<>]+?)改稿"/)) {
				chapter_data.date.push(matched[1].to_Date({
					zone : 9
				}) || matched[1]);
			}
			work_data.chapter_list.push(chapter_data);
			// console.log(chapter_data);
		}
		work_data.chapter_count = work_data.chapter_list.length;

		work_data.ebook = new CeL.EPUB(work_data.directory
				+ work_data.directory_name, {
			// start_over : true,
			// 小説ID
			identifier : work_data.id,
			title : work_data.title,
			language : language
		});
		// http://www.idpf.org/epub/31/spec/epub-packages.html#sec-opf-dcmes-optional
		work_data.ebook.set({
			// 作者名
			creator : work_data.author,
			// 出版時間 the publication date of the EPUB Publication.
			date : CeL.EPUB.date_to_String(work_data.last_update.to_Date({
				zone : 9
			})),
			// ジャンル, タグ, キーワード
			subject : work_data.status,
			// あらすじ
			description : work_data.description,
			publisher : work_data.site_name + ' (' + this.base_URL + ')',
			source : work_data.url
		});

		if (work_data.image) {
			work_data.ebook.set_cover(work_data.image);
		}
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter) {
		return this.chapter_list_URL(work_data.id)
				+ work_data.chapter_list[chapter - 1].url;
	},
	parse_chapter_data : function(html, work_data, get_label, chapter) {
		// 檢測所取得內容的章節編號是否相符。
		var text = get_label(html.between('<div id="novel_no">', '/')) | 0;
		if (chapter !== text) {
			throw new Error('Different chapter: Should be ' + chapter
					+ ', get ' + text + ' inside contents.');
		}

		text = html.between('<div id="novel_honbun"', '<div class="novel_bn">')
		//
		.between('>', {
			tail : '</div>'
		});

		var part_title = get_label(html.between('<p class="chapter_title">',
				'</p>')),
		//
		chapter_title = get_label(html.between('<p class="novel_subtitle">',
				'</p>'));

		var file_title = chapter.pad(3) + ' '
				+ (part_title ? part_title + ' - ' : '') + chapter_title,
		//
		item = work_data.ebook.add({
			title : file_title,
			internalize_media : true,
			file : CeL.to_file_name(file_title + '.xhtml'),
			date : work_data.chapter_list[chapter - 1].date
		}, {
			title : part_title,
			sub_title : chapter_title,
			text : text
		});
	},
	finish_up : function(work_data) {
		if (work_data) {
			work_data.ebook.pack([ this.main_directory,
			//
			'(一般小説) [' + work_data.author + '] ' + work_data.title
			//
			+ ' [' + work_data.site_name + ' '
			//
			+ work_data.last_update.to_Date({
				zone : 9
			}).format('%Y%2m%2d') + '].' + work_data.id + '.epub' ],
					this.remove_ebook_directory);
		}
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

syosetu.start(work_id);
