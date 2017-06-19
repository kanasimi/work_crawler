/**
 * 批量下載2017 恋上你看书网的工具。 Download 630book novels. 本站在流量大的時候，似乎會限制讀取速率。
 * 
 * @see http://www.76wx.com/
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

var charset = 'gbk';
CeL.character.load(charset);

var _630book = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節。
	// 'changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。
	recheck : 'changed',

	// one_by_one : true,
	base_URL : 'http://www.630book.la/',
	charset : charset,

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'modules/article/search.php?'
			+ 'searchtype=articlename&searchkey=',
	parse_search_result : function(html, get_label) {
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [], get_next_between = html.find_between(
				'<td class="odd" align="center"><a href="/shu/', '</a>'), text;

		while ((text = get_next_between()) !== undefined) {
			var matched = text.between(null, '"').match(/([\d_]+)\.html$/);
			id_list.push(matched[1]);
			matched = text.between('>');
			id_data.push(get_label(matched));
		}

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return '/shu/' + work_id + '.html';
	},
	parse_work_data : function(html, get_label) {
		// 由 meta data 取得作品資訊。
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : html.between('og:novel:title" content="', '"')
					|| html.between('og:title" content="', '"')
					|| html.between('og:novel:book_name" content="', '"'),

			// 選擇性屬性：須配合網站平台更改。
			author : html.between('og:novel:author" content="', '"'),
			// e.g., 连载[中], [已]完成
			status : [ html.between('og:novel:status" content="', '"'),
					html.between('og:novel:category" content="', '"') ],
			image : html.between('og:image" content="', '"'),
			last_update : html.between('og:novel:update_time" content="', '"')
			// e.g., 630book
			|| html.between('og:novel:update_time" content=\'', "'"),
			latest_chapter : html.between(
					'og:novel:latest_chapter_name" content="', '"'),
			description : html.between('og:description" content="', '"')
			// e.g., 630book
			|| get_label(html.between('<div id="intro">', '</div>')),
			language : 'cmn-Hans-CN',
			site_name : get_label(html.between('<div class="logo">', '</div>')
			//
			|| html.between('<div class="header_logo">', '</div>')
			// e.g., 630book
			|| html.between('<strong class="logo">', '</strong>'))
		};

		return work_data;
	},
	get_chapter_count : function(work_data, html, get_label) {
		// determine base directory of work
		work_data.base_url = work_data.url.endsWith('/') ? work_data.url
				: work_data.url.replace(/\.[^.]+$/, '/');
		if (work_data.base_url.startsWith(this.base_URL)) {
			work_data.base_url = work_data.base_url
					.slice(this.base_URL.length - 1);
		}

		work_data.chapter_list = [];
		html.between('<dl class="zjlist">', '</dl>')
		//
		.each_between('<dd>', '</dd>', function(text) {
			text = text.between('<a ', '</a>');
			work_data.chapter_list.push({
				url : text.between('href="', '"'),
				title : get_label(text.between('>'))
			});
		});
	},

	// 取得每一個章節的內容與各個影像資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter) {
		var url = work_data.chapter_list[chapter - 1].url;
		return url.startsWith('/') ? url : work_data.base_url + url;
	},
	parse_chapter_data : function(html, work_data, get_label, chapter) {
		var next_url = html.match(/ href="([^"]+.html)"[^<>]*>下一[章页]/),
		//
		next_chapter = work_data.chapter_list[chapter];
		// console.log(chapter + ': ' + next_url[1]);
		if (next_url && next_chapter
		// 有些在目錄上面的章節連結到了錯誤的頁面，只能靠下一頁來取得正確頁面。
		&& (next_chapter.url !== (next_url = next_url[1]))
		//
		&& (!next_url.startsWith(work_data.base_url)
		// 正規化規範連結。
		|| next_chapter.url !== next_url.slice(work_data.base_url.length))) {
			CeL.info(CeL.display_align([
					[ 'chapter ' + chapter + ': ', next_chapter.url ],
					[ '→ ', next_url ] ]));
			next_chapter.url = next_url;
		}
		this.add_ebook_chapter(work_data, chapter, {
			sub_title : get_label(html.between('<h1>', '</h1>')),
			text : html.between('<div id="content">', '</div>').replace(
					/<script[^<>]*>[^<>]*<\/script>/, '')
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

_630book.start(work_id);
