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

require('./work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// CeL.character.load()
, 'data.character'
// .to_file_name()
, 'application.net',
// CeL.detect_HTML_language()
, 'application.locale' ]);

var charset = 'EUC-JP';
CeL.character.load(charset);

var AlphaPolis = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節。
	// 'changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。
	recheck : 'changed',

	// one_by_one : true,
	base_URL : 'http://www.alphapolis.co.jp/',
	charset : charset,

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
		id_list = [];
		html.each_between('<h3 class="title">', '</a>', function(text) {
			id_list.push(+text.between(' href="/content/cover/', '/"'));
			id_data.push(text.between('>'));
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'content/cover/' + (work_id | 0);
	},
	parse_work_data : function(html, get_label) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : html.between('"og:title" content="', '"'),

			// 選擇性屬性：須配合網站平台更改。
			// e.g., 连载中, 連載中
			status : get_label(
					html.between('<div class="category novel_content">',
							'</div>')).split(/[\s\n]+/),
			author : get_label(html.between('<div class="author">', '</a>')),
			last_update : get_label(html.between('<th>更新日時</th>', '</td>')),
			site_name : 'アルファポリス'

		}, PATTERN = /<meta property="og:([^"]+)" content="([^"]+)"/g, matched;

		while (matched = PATTERN.exec(html)) {
			work_data[matched[1]] = get_label(matched[2]);
		}

		if (work_data.image
		// ignore site default image
		&& work_data.image.endsWith('\/ogp.png')) {
			delete work_data.image;
		}

		return work_data;
	},
	get_chapter_count : function(work_data, html) {
		work_data.chapter_list = [];
		html = html.between('<div class="toc cover_body">',
		// 不能用'<div class="each_other_title">':
		// 有些作品沒有"この作品を読んでいる人はこんな作品も読んでいます！"
		// e.g., ちょっと魔王になって人類救ってくる
		'<div class="ad section">')
		//
		.each_between('<li', '</li>', function(text) {
			work_data.chapter_list.push({
				url : text.between('<a href="', '"'),
				date : text.between('<span class="open_date">', '</span>')
				//
				.to_Date({
					zone : work_data.time_zone
				}),
				title : text.between('<span class="title">', '</span>')
			});
		});
	},

	// 檢測所取得內容的章節編號是否相符。
	check_chapter_NO : [ '<div class="total_content_block_count">', '/' ],
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		this.add_ebook_chapter(work_data, chapter_NO, {
			title : html.between('<div class="chapter_title">', '</div>'),
			sub_title : html.between('<h2>', '</h2>'),
			text : html.between('<div class="text', '<a class="bookmark ')
					.between('>', {
						tail : '</div>'
					})
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

AlphaPolis.start(work_id);
