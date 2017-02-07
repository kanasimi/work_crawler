/**
 * 批量下載カクヨム小説的工具。 Download kakuyomu novels.
 */

'use strict';

require('./comic loder.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// CeL.character.load()
, 'data.character'
// .to_file_name()
, 'application.net',
// CeL.detect_HTML_language()
, 'application.locale' ]);

var kakuyomu = new CeL.comic.site({
	// recheck:從頭檢測所有作品之所有章節。
	// 'changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。
	recheck : 'changed',

	// one_by_one : true,
	base_URL : 'https://kakuyomu.jp/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search?order=popular&q=',
	parse_search_result : function(html, get_label) {
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [], matched, PATTERN =
		//
		/<a href="\/works\/(\d+)" [^<>]*itemprop="name">(.+?)<\/a>/g;
		while (matched = PATTERN.exec(html)) {
			id_list.push(matched[1]);
			id_data.push(get_label(matched[2]));
		}
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'works/' + work_id;
	},
	parse_work_data : function(html, get_label) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1 id="workTitle">', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			// e.g., 连载中, 連載中
			status : [],
			author : get_label(html.between(
					'<span id="workAuthor-activityName">', '</span>')),
			last_update : get_label(html.between(
					'<p class="widget-toc-date"><time datetime="', '"')),
			catchphrase : get_label(
			//
			html.between('<p id="catchphrase"', '</p>').between('>')
			// [[Quotation mark]]
			// The Unicode standard introduced a separate character
			// U+2015 ― HORIZONTAL BAR to be used as a quotation dash.
			.replace('<span id="catchphrase-authorDash"></span>', '―')).trim()
					.replace(/\s+/g, ' '),
			description : html.between('work-introduction">', '</p>').trim()

		}, PATTERN = /<meta property="og:([^"]+)" content="([^"]+)"/g, matched;

		while (matched = PATTERN.exec(html)) {
			// 避免覆寫
			if (!work_data[matched[1]]) {
				work_data[matched[1]] = get_label(matched[2]);
			}
		}

		PATTERN = /<dt>(.+?)<\/dt>[^<>]*<dd>(.+?)<\/dd>/g;
		var text = html.between('<dl class="widget-credit">', '</dl>');
		while (matched = PATTERN.exec(text)) {
			work_data[get_label(matched[1])] = get_label(matched[2]);
		}

		var get_next_between = html.between(
				'<p class="widget-toc-workStatus">', '</p>').all_between(
				'<span>', '</span>');

		while ((text = get_next_between()) !== undefined) {
			work_data.status.push(get_label(text));
		}
		if (work_data.種類) {
			work_data.status.push(work_data.種類);
		}
		work_data.status = work_data.status.filter(function(item) {
			return !!item;
		}).join(',');
		work_data.site_name = work_data.site_name.between(null, ' ');

		if (work_data.image
		// ignore site default image
		&& work_data.image.includes('common\/ogimage.png')) {
			delete work_data.image;
		}

		return work_data;
	},
	get_chapter_count : function(work_data, html) {
		// e.g., 'ja-JP'
		var language = CeL.detect_HTML_language(html);
		html = html.between('<div class="widget-toc-main">', '</div>');
		work_data.chapter_list = [];
		var get_next_between = html.all_between('<li', '</li>'), text;
		while ((text = get_next_between()) !== undefined) {
			if (text.includes(' widget-toc-level')) {
				// is main title
				continue;
			}
			work_data.chapter_list.push({
				url : text.between('<a href="', '"'),
				date : new Date(text.between(
				//
				'datePublished" datetime="', '"')),
				title : text.between(
						'<span class="widget-toc-episode-titleLabel">',
						'</span>')
			});
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
			date : CeL.EPUB.date_to_String(work_data.last_update),
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
		return work_data.chapter_list[chapter - 1].url;
	},
	parse_chapter_data : function(html, work_data, get_label, chapter) {
		// <div class="widget-episodeBody js-episode-body" ...>
		var text = html.between('episodeBody', '</div>').between('>');

		var part_title = [],
		//
		chapter_title = get_label(html.between(
				'<p class="widget-episodeTitle">', '</p>'));

		html.between('<p id="globalHeader-closeButton"', '</ul>')
		//
		.replace(/<li><span title="([^"]+)">/g, function(all, t) {
			part_title.push(get_label(t));
			return all;
		});
		part_title = part_title.join(' - ');

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
		this.pack_ebook(work_data);
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

kakuyomu.start(work_id);
