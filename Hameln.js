/**
 * 批量下載ハーメルン - SS･小説投稿サイト- 小説的工具。 Download Hameln novels.
 */

'use strict';

require('./comic loder.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// .to_file_name()
, 'application.net' ]);

var Hameln = new CeL.comic.site({
	// 重新取得每個章節內容chapter_page。
	// 警告: reget_chapter=false僅適用於小說之類不取得圖片的情形，
	// 因為若有圖片（parse_chapter_data()會回傳chapter_data.image_list），將把chapter_page寫入僅能從chapter_URL取得名稱的於目錄中。
	reget_chapter : false,
	// recheck:從頭檢測所有作品之所有章節。
	recheck : true,

	// one_by_one : true,
	base_URL : 'https://syosetu.org/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : '?mode=search&word=',
	parse_search_result : function(html) {
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [], get_next_between = html.all_between(
				'<div class="float hide blo_title_base">', '</a>'), text;
		while ((text = get_next_between()) !== undefined) {
			id_list.push(
			//
			text.between(' href="//novel.syosetu.org/', '/"') | 0);
			id_data.push(text.between('<b>', '</b>'));
		}
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return '?mode=ss_detail&nid=' + work_id;
	},
	parse_work_data : function(html, get_label) {
		html = html.between('<table width=100% class=table1>', '</div>');
		var work_data = CeL.null_Object(), matched, PATTERN =
		//
		/<td bgcolor=#DDDDDD[^<>]*>([^<>]+)<\/td><td[^<>]*>(.+?)<\/td>/g;

		while (matched = PATTERN.exec(html)) {
			work_data[matched[1]] = get_label(matched[2]);
		}

		work_data = Object.assign({
			// 必要屬性：須配合網站平台更改。
			title : work_data.タイトル,

			// 選擇性屬性：須配合網站平台更改。
			// e.g., 连载中, 連載中
			status : work_data.タグ.split(/\s+/),
			author : work_data.作者,
			last_update : work_data.最新投稿,
			description : work_data.あらすじ,
			site_name : 'ハーメルン'
		}, work_data);

		if (work_data.警告タグ) {
			work_data.status.push(work_data.警告タグ);
		}
		work_data.status = work_data.status.join(',');

		return work_data;
	},
	chapter_list_URL : function(work_id) {
		return 'https://novel.syosetu.org/' + work_id + '/';
	},
	get_chapter_count : function(work_data, html) {
		html = html.between('<table width=100%>', '</div>');
		work_data.chapter_list = [];
		var part_title,
		//
		get_next_between = html.all_between('<tr', '</tr>'), text;
		while ((text = get_next_between()) !== undefined) {
			if (text.includes('<td colspan=2><strong>')) {
				part_title = text.between('<strong>', '</strong>');
				continue;
			}

			var matched = text.match(/ href=([^ "<>]+)[^<>]*>(.+?)<\/a>/);
			if (!matched) {
				throw text;
			}

			var chapter_data = {
				part_title : part_title,
				url : matched[1].replace(/^.\//, ''),
				date : [ text.match(/>(2\d{3}年[^"<>]+?)</)[1]
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
		var text = html
		//
		.between('<div class="ss">', '<span id="analytics_end">')
		// remove </div>
		.between(null, {
			tail : '</div>'
		})
		// remove chapter count (e.g., 1 / 1)
		.replace(/<p><span style="font-size:120%">.+?<\/p>/, '')
		// e.g., id="text" → id="text"
		.replace(/ (id)=([a-z]+)/g, ' $1="$2"')
		// remove chapter title
		.replace(
				/[\s\n]+<span style="font-size:120%">(?:.+?)<\/span><BR><BR>/g,
				'');

		var chapter_data = work_data.chapter_list[chapter - 1],
		//
		part_title = chapter_data.part_title,
		//
		chapter_title = chapter_data.title;

		var file_title = chapter.pad(3) + ' '
				+ (part_title ? part_title + ' - ' : '') + chapter_title,
		//
		item = work_data.ebook.add({
			title : file_title,
			file : CeL.to_file_name(file_title + '.xhtml'),
			date : work_data.chapter_list[chapter - 1].date
		}, {
			title : part_title,
			sub_title : chapter_title,
			text : text
		});
	},
	finish_up : function(work_data) {
		work_data && work_data.ebook.pack(this.main_directory);
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

Hameln.start(work_id);
