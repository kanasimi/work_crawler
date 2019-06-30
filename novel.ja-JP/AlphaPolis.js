/**
 * 批量下載アルファポリス - 電網浮遊都市 - 小説的工具。 Download AlphaPolis novels.
 * 
 * @see 小説投稿サイト https://matome.naver.jp/odai/2139450042041120001
 *      http://www.akatsuki-novels.com/novels/ranking_total
 *      http://www.mai-net.net/bbs/sst/sst.php?act=list&cate=all&page=1
 *      https://github.com/whiteleaf7/narou
 *      https://github.com/59naga/scrape-narou
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
	// recheck:從頭檢測所有作品之所有章節。
	// 'changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。
	// ** 以本站來說太消耗時間。
	recheck : 'changed',

	// 2018/10/16-19 間開始: 頁面讀得太頻繁，例如連續讀取20個頁面，之後會只提供無內容頁面。
	// 開新的 instance 可以多重下載作品。
	// 2019/1/29: 13s 還不行, 15s OK (每20個章節需要超過5分鐘)
	chapter_time_interval : '15s',

	base_URL : 'https://www.alphapolis.co.jp/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search?category=novel&query=',
	// till 20170619, use POST. 20170620 AlphaPolis 改版, use UTF-8.
	search_URL_2016_to_20170619 : function(work_title) {
		return [ 'top/search/', {
			// 2: 小説
			'data[tab]' : 2,
			'data[refer]' : work_title
		} ];
	},
	parse_search_result : function(html, get_label) {
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [];
		html.each_between('<h2 class="title">', '</h2>', function(text) {
			id_list.push(text.between(' href="/novel/', '"')
			//
			.replace('/', '-'));
			// get <a>.innerText
			id_data.push(get_label(text.between('>', '<')));
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'novel/' + work_id.replace('-', '/');
	},
	parse_work_data : function(html, get_label) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : html.between('"og:title" content="', '"'),

			// 選擇性屬性：須配合網站平台更改。
			// e.g., 连载中, 連載中
			status : [],
			// get the first <div class="author">...</div>
			author : get_label(html.between('<div class="author">', '</a>')),
			last_update : get_label(html.between('<th>更新日時</th>', '</td>')),
			description : get_label(html.between('<div class="abstract">',
					'</div>')),
			// site_name : 'アルファポリス'
			language : 'ja-JP'

		}, PATTERN = /<meta property="og:([^"]+)" content="([^"]+)"/g, matched;

		if (work_data.title === 'Not Found' && !work_data.author) {
			// 對於已經失效的作品，直接中斷下載。
			throw work_data.title;
		}

		while (matched = PATTERN.exec(html)) {
			work_data[matched[1]] = get_label(matched[2]);
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

		// 作品の情報
		PATTERN = /<th>([\s\S]+?)<\/th>[\s\n]*<td[^<>]*>([\s\S]+?)<\/td>/g;
		while (matched = PATTERN.exec(html.between('<table class="detail">',
				'</table>'))) {
			work_data[get_label(matched[1])] = get_label(matched[2]);
		}

		if (work_data.image
		// ignore site default image
		&& work_data.image.endsWith('\/ogp.png')) {
			delete work_data.image;
		}

		return work_data;
	},
	get_chapter_list : function(work_data, html) {
		work_data.chapter_list = [];
		html = html.between('<div class="nav">', '<div class="freespace">')
		//
		.each_between('<a href="/novel/', '</a>', function(text) {
			work_data.chapter_list.push({
				url : '/novel/' + text.between(null, '"'),
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

	// 2017/6/27 アルファポリスアプリの小説レンタルサービス開始
	// https://www.alphapolis.co.jp/diary/view/12394/
	// 有些作品章節編號可能會被跳過。
	// 檢測所取得內容的章節編號是否相符。
	_check_chapter_NO : [ '<div class="page-count">', '/' ],
	parse_chapter_data : function(html, work_data, get_label, chapter) {
		// <div class="text " id="novelBoby">
		var text = html.between('<div class="text',
		// <div class="episode-navigation section ">
		'<div class="episode-navigation');
		if (text.includes('しおりを挟む</a>')) {
			text = text.between(null, {
				tail : 'しおりを挟む</a>'
			});
		}
		text = text.between('>', {
			tail : '</div>'
		});
		if (text.length < 200 && text.includes(' id="LoadingEpisode"')) {
			// console.log(html);
			CeL.warn((work_data.title || work_data.id)
			//
			+ ': 讀取太過頻繁，只取得了無內容頁面！');
			// text: <div class="dots-indicator" id="LoadingEpisode">
			// assert: get_label(text) === ''
			text = '';
		}
		this.add_ebook_chapter(work_data, chapter, {
			title : html.between('<div class="chapter-title">', '</div>'),
			sub_title : html.between('<h2 class="episode-title">', '</h2>'),
			text : text
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
