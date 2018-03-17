/**
 * 批量下載2011 顶点小说(www.23us.com)的工具。 Download 23us novels. 本站有限制讀取速率。
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

var _23us = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節。
	// 'changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。
	recheck : 'changed',

	// one_by_one : true,
	base_URL : 'http://www.23us.com/',
	charset : charset,

	// 解析 作品名稱 → 作品id get_work()
	search_URL : {
		URL : 'http://zhannei.baidu.com/cse/'
				+ 'search?s=8253726671271885340&entry=1&q=',
		charset : 'utf-8'
	},
	parse_search_result : function(html, get_label) {
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [],
		// e.g., <a cpos="title" href="http://www.23us.com/html/55/55536/"
		// title="妖神记" class="result-game-item-title-link" target="_blank">
		get_next_between = html
		//
		.find_between('<a cpos="title" href="', '</a>'), text;

		while ((text = get_next_between()) !== undefined) {
			var matched = text.between(null, '"').match(/(\d+)\/$/);
			id_list.push(matched[1]);
			matched = text.match(/ title="([^"]+)"/);
			id_data.push(get_label(get_label(matched[1])));
		}

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'book/' + work_id;
	},
	parse_work_data : function(html, get_label) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>')
			//
			.replace('全文阅读', '')),

			// 選擇性屬性：須配合網站平台更改。
			image : html.between('全文阅读</h1></dd>', '</div>').between('src="',
					'"'),
			description : html.between('内容简介：</b></p>',
					'<p style="display:none" id="sidename">').between(
					'</table>')

		}, get_next_between = html.between(' id="at">', '</table>')
				.find_between('>', '<'), text;

		while ((text = get_next_between()) !== undefined) {
			var key = get_label(text.between(null, '</th>')),
			//
			value = get_label(text.between('<td>'));
			work_data[key] = value;
		}

		html.between('<p class="widget-toc-workStatus">', '</p>')
		//
		.each_between('<span>', '</span>', function(text) {
			work_data.status.push(get_label(text));
		});

		Object.assign(work_data, {
			// 選擇性屬性：須配合網站平台更改。
			// e.g., 连载中, 連載中
			status : [ work_data.文章状态, work_data.文章类别 ],
			author : work_data.文章作者,
			last_update : work_data.最后更新,
			site_name : '顶点小说'
		});

		work_data.site_name = work_data.site_name.between(null, ' ');

		if (work_data.image
		// ignore site default image
		// http://www.23us.com/modules/article/images/nocover.jpg
		&& work_data.image.includes('nocover.jpg')) {
			delete work_data.image;
		}

		return work_data;
	},
	// 對於章節列表與作品資訊分列不同頁面(URL)的情況，應該另外指定.chapter_list_URL。
	chapter_list_URL : function(work_id) {
		return 'html/' + work_id.slice(0, -3) + '/' + work_id + '/';
	},
	get_chapter_list : function(work_data, html, get_label) {
		work_data.chapter_list = [];
		html.between(' id="at">', '<div ')
		//
		.each_between('<td', '</td>', function(text) {
			work_data.chapter_list.push({
				url : text.between(' href="', '"'),
				title : get_label(text.between('<a ', '</a>').between('>'))
			});
		});
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter_NO) {
		return work_data.chapter_list_URL
				+ work_data.chapter_list[chapter_NO - 1].url;
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		this.add_ebook_chapter(work_data, chapter_NO, {
			title : get_label(html.between('<h1>', '</h1>')
			//
			.replace(/^正文/, '')),
			text : html.between('<dd id="contents">', '</dd>')
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

_23us.start(work_id);
