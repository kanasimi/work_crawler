/**
 * 批量下載小説家になろう/ノクターンノベルズ的工具。 Download syosetu.com novels.
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
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節。
	// 'changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。
	recheck : 'changed',

	// one_by_one : true,
	base_URL : 'http://noc.syosetu.com/',
	novel_base_URL : 'http://novel18.syosetu.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search/search/search.php?order=hyoka&word=',
	parse_search_result : function(html, get_label) {
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [];
		html.each_between('<div class="novel_h">', '</a>', function(text) {
			id_list.push(text.between(' href="' + this.novel_base_URL, '/"'));
			id_data.push(get_label(text.between('/">')));
		}, this);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return this.novel_base_URL
		//
		+ 'novelview/infotop/ncode/' + work_id + '/';
	},
	parse_work_data : function(html, get_label) {
		var work_data = CeL.null_Object();
		html.between('<table', '<div id="ad_s_box">')
		//
		.each_between('<tr>', '</tr>', function(text) {
			work_data[get_label(text.between('<th', '</th>').between('>'))]
			//
			= get_label(text.between('<td', '</td>').between('>'));
		});

		work_data = Object.assign({
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('dc:title="', '"')),

			// 選擇性屬性：須配合網站平台更改。
			// e.g., 连载中, 連載中
			// <span id="noveltype">完結済</span>全1部
			// <span id="noveltype_notend">連載中</span>全1部
			status : [ html.between('<span id="noveltype', '<').between('>') ]
					.append(work_data.ジャンル ? work_data.ジャンル.split(/\s+/) : '')
					.append(work_data.キーワード.split(/\s+/)),
			author : work_data.作者名,
			last_update : work_data.最終話掲載日 || work_data.掲載日,
			description : work_data.あらすじ,
			site_name : 'ノクターンノベルズ'
		}, work_data);

		work_data.status = work_data.status.filter(function(item) {
			return !!item;
		}).join(',');

		return work_data;
	},
	// 對於章節列表與作品資訊分列不同頁面(URL)的情況，應該另外指定.chapter_list_URL。
	chapter_list_URL : function(work_id) {
		return this.novel_base_URL + work_id + '/';
	},
	get_chapter_count : function(work_data, html) {
		// TODO: 對於單話，可能無目次。
		work_data.chapter_list = [];
		html.between('<div class="index_box">', '<div id="novel_footer">')
		//
		.each_between('<dl class="novel_sublist2">', '</dl>', function(text) {
			var matched = text.match(
			// [ , href, inner ]
			/ href="\/[^\/]+\/([^ "<>]+)[^<>]*>(.+?)<\/a>/);
			if (!matched) {
				throw text;
			}

			var chapter_data = {
				url : matched[1].replace(/^\.\//, ''),
				// 掲載日
				date : [ text.match(/>\s*(2\d{3}[年\/][^"<>]+?)</)[1].to_Date({
					zone : work_data.time_zone
				}) ],
				title : matched[2]
			};
			if (matched = text.match(/ title="(2\d{3}[年\/][^"<>]+?)改稿"/)) {
				chapter_data.date.push(matched[1].to_Date({
					zone : work_data.time_zone
				}) || matched[1]);
			}
			work_data.chapter_list.push(chapter_data);
			// console.log(chapter_data);
		});

		if (work_data.chapter_list.length === 0
				&& html.includes('<div id="novel_honbun"')) {
			// 短編小説
			work_data.chapter_list.push({
				url : this.chapter_list_URL(work_data.id),
				// 掲載日
				date : [ work_data.last_update.to_Date({
					zone : work_data.time_zone
				}) ],
				title : work_data.title
			});
		}

		work_data.chapter_count = work_data.chapter_list.length;
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter) {
		var url = work_data.chapter_list[chapter - 1].url;
		if (url.includes('://')) {
			// e.g., 短編小説
			return url;
		}
		return this.chapter_list_URL(work_data.id) + url;
	},
	parse_chapter_data : function(html, work_data, get_label, chapter) {
		// 檢測所取得內容的章節編號是否相符。
		var text = get_label(html.between('<div id="novel_no">', '/')) | 0;
		if (chapter !== text
				&& (!work_data.status.includes('短編') || text !== 0)) {
			throw new Error('Different chapter: Should be ' + chapter
					+ ', get ' + text + ' inside contents.');
		}

		text = html.between('<div id="novel_color">',
				'</div><!--novel_color-->');
		var
		/** {Number}未發現之index。 const: 基本上與程式碼設計合一，僅表示名義，不可更改。(=== -1) */
		NOT_FOUND = ''.indexOf('_');
		var index = text.indexOf('<div id="novel_p"');
		if (index === NOT_FOUND
		//
		&& (index = text.indexOf('<div id="novel_honbun"')) === NOT_FOUND) {
			throw new Error('text not found!');
		}
		text = text.slice(index);
		text = text.between(null, {
			// 後半段的"次の話"
			tail : '<div class="novel_bn">'
		}) || text;

		var links = [], ebook = work_data[this.KEY_EBOOK];

		text.each_between('<a ', '</a>', function(text) {
			var matched = text.match(/(?:^| )href="([^"<>]+)"/);
			// @see http://ncode.syosetu.com/n8611bv/49/
			// e.g., <a href="http://11578.mitemin.net/i00000/"
			if (matched && matched[1].includes('.mitemin.net')) {
				// 下載mitemin.net的圖片
				links.push(matched[1]);
			}
		});

		links.forEach(function(url) {
			// 登記有url正處理中，須等待。
			ebook.downloading[url] = url;
			CeL.get_URL(url, function(XMLHttp) {
				delete ebook.downloading[url];
				if (!XMLHttp || !XMLHttp.responseText) {
					return;
				}
				var matched = XMLHttp.responseText
						.match(/<a href="([^"<>]+)" target="_blank">/);
				if (matched) {
					// 因為.add()會自動添加.downloading並在事後檢查.on_all_downloaded，因此這邊不用再檢查。
					ebook.add({
						url : matched[1]
					});
				} else {
					CeL.err('No image got: ' + url);
				}
			});
		});

		var series_title = get_label(
		//
		html.between('<p class="series_title">', '</p>'));
		if (series_title) {
			ebook.set([ {
				meta : null,
				name : "calibre:series",
				content : series_title = get_label(series_title)
			} ]);
		}
		this.add_ebook_chapter(work_data, chapter, {
			title : html.between('<p class="chapter_title">', '</p>')
			// 短編小説
			|| series_title,
			sub_title : html.between('<p class="novel_subtitle">', '</p>')
			// 短編小説
			|| html.between('<p class="novel_title">', '</p>'),
			text : text
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

// for 年齢確認
syosetu.get_URL_options.agent.last_cookie = 'over18=yes';
syosetu.start(work_id);
