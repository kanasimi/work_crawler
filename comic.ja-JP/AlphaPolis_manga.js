/**
 * 批量下載アルファポリス - 電網浮遊都市 - 公式漫画的工具。 Download AlphaPolis official mangas.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({

	base_URL : 'https://www.alphapolis.co.jp/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search?category=official_manga&query=',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [];
		html.each_between(' class="title">', '</a>', function(text) {
			// console.log(text);
			var id = text.between(' href="/manga/official/', '"');
			if (id) {
				id_list.push(id);
				id_data.push(get_label(text.between('>')));
			}
		});
		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'manga/official/' + work_id.replace('-', '/');
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between(
			// 2019/1/21 アルファポリス 公式漫画 改版
			'<div class="manga-detail-description', '</div>')
			// <div class="manga-detail-description section"> <div
			// class="title"> <h1>title</h1> </div>
			.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			// e.g., 连载中, 連載中
			// <div class="wrap-content-status">
			status : html.between('<div class="status">', '</div>').split(
					'</span>').map(get_label),
			author : get_label(html.between('<div class="author-label">',
					'</a>')),
			last_update : get_label(html.between('<div class="up-time">',
					'</div>')),
			next_update : get_label(html
			// <span class="next-up-time">
			.between(' class="next-up-time">', '<')),
			description : get_label(html.between('<div class="outline">',
					'</div>')),
			// site_name : 'アルファポリス'
			language : 'ja-JP'

		};

		// console.log(html);
		extract_work_data(work_data, html);

		work_data.status = work_data.status.concat(
				html.between(' class="manga-detail-tags', '</div>')
						.between('>').split('</a>').map(get_label))
		//
		.filter(function(tag) {
			return !!tag;
		});

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html) {
		work_data.chapter_list = [];
		html = html.between('<div class="episode', '<div class="scroll')
		//
		.between('>').split('href="/manga/official/').slice(1)
		//
		.forEach(function(text) {
			// console.log(JSON.stringify(text));
			work_data.chapter_list.push({
				url : '/manga/official/'
				//
				+ text.between(null, '"'),
				date : text.between('<div class="up-time">', '</span>')
				//
				.replace('更新', ''),
				// '<div class="title">', '</div>'
				title : text.between(' class="title">', '</')
			});
		});
		work_data.chapter_list.reverse();
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		Object.assign(chapter_data, {
			// 設定必要的屬性。
			title : get_label(html.between('<h2>', '</h2>')),
			image_list : []
		});

		html.each_between('_pages.push("', '"', function(url) {
			if (url.includes('://'))
				chapter_data.image_list.push(url);
		});

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

// for 年齢確認
crawler.get_URL_options.cookie = 'confirm=' + Math.floor(Date.now() / 1000);
start_crawler(crawler, typeof module === 'object' && module);
