/**
 * 批量下載アルファポリス - 電網浮遊都市 - Web漫画/無料の投稿漫画 的工具。 Download AlphaPolis user manga.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({

	// 當網站不允許太過頻繁的訪問/access時，可以設定下載之前的等待時間(ms)。
	// 模仿實際人工請求。
	// chapter_time_interval : '5s',

	base_URL : 'https://www.alphapolis.co.jp/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search?category=manga&query=',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		var _this = this, id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [];
		html.each_between(' class="title">', '</a>', function(text) {
			// console.log(text);
			var id = text.between(' href="/manga/', '"');
			if (id) {
				if (_this.is_official && id.startsWith('official/'))
					id = id.between('official/');
				id_list.push(id.replace(/\//, '-'));
				id_data.push(get_label(text.between('>')));
			}
		});
		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'manga/' + (this.is_official ? 'official/' : '')
				+ work_id.replace('-', '/');
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			// 2019/8/16 19:0 改版。
			title : get_label(html.between('<h2 class="title">', '</h2>')),

			// 選擇性屬性：須配合網站平台更改。
			// e.g., 连载中, 連載中
			status : [],
			// get the first <div class="author">...</div>
			author : get_label(html.between('<div class="author">', '</a>')),
			last_update : get_label(html.between('<th>更新日時</th>', '</td>')),
			description : get_label(
					html.between('<div class="abstract">', '</div>')).replace(
					/\n{2}/g, '\n'),
			ranking : get_label(html.between('<div class="ranking">',
			// also category
			'</div>')).replace(/\t/g, '').replace(/\n{3}/g, '\0').replace(
					/\n/g, ' ').split('\0'),
			// site_name : 'アルファポリス'
			language : html.between('data-lang="', '"') || 'ja-JP'

		}, PATTERN, matched;

		if (work_data.title === 'Not Found' && !work_data.author) {
			// 對於已經失效的作品，直接中斷下載。
			throw work_data.title;
		}

		if (work_data.site_name) {
			// "アルファポリス - 電網浮遊都市 - " → "アルファポリス"
			work_data.site_name = work_data.site_name.replace(/ +- .+/, '');
		}

		// 2019/1 才發現改 pattern 了。
		PATTERN = /<span class="tag">([\s\S]+?)<\/span>/g;
		while (matched = PATTERN.exec(html.between(
				'<div class="content-tags">', '</div>'))) {
			work_data.status.push(get_label(matched[1]));
		}

		html.between('<div class="content-statuses">', '</div>')
		// additional tags
		.each_between(' class="content-status', '<',
		//
		function(text) {
			work_data.status.push(get_label(text.between('>')));
		});
		work_data.status = work_data.status.unique();

		// <h2>作品の情報</h2>
		extract_work_data(work_data, html,
				/<th>([\s\S]+?)<\/th>[\s\n]*<td[^<>]*>([\s\S]+?)<\/td>/g);

		extract_work_data(work_data, html);

		if (work_data.image
		// ignore site default image
		&& work_data.image.endsWith('\/ogp.png')) {
			delete work_data.image;
		}

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html) {
		work_data.chapter_list = [];
		html = html.between('<div class="nav">', '<div class="freespace">')
		//
		.each_between('<a href="/manga/', '</a>', function(text) {
			work_data.chapter_list.push({
				url : '/manga/' + text.between(null, '"'),
				date : text.between('<span class="open-date">', '</span>')
				//
				.to_Date({
					zone : work_data.time_zone
				}),
				title : text.between(' class="title">',
				// '<span class="title"><span class="bookmark-dummy"></span>',
				// '</span>'
				'<span class="open-date">')
			});
		});
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);
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

// for 年齢確認 eternityConfirm()
crawler.setup_value('cookie', [ 'confirm=' + Math.floor(Date.now() / 1000)
// location.hostname
+ ';domain=' + crawler.base_URL.match(/\/\/([^\/]+)/)[1] + ';path=/;' ]);

start_crawler(crawler, typeof module === 'object' && module);
