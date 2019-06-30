/**
 * 批量下載 2011 顶点小说 的工具。 Download 23us novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.storage.EPUB');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。default:false
	// recheck='changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。否則只會自上次下載過的章節接續下載。
	recheck : 'changed',

	// one_by_one : true,
	base_URL : 'https://www.x23us.com/',
	charset : 'gbk',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'modules/article/search.php?searchtype=keywords&searchkey=',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		var matched = html.match(/og:url" content="[^<>"]+?\/(\d+)"/);
		if (matched) {
			return [ [ +matched[1] ],
			//
			[ get_label(html.between('<h1>', '</h1>').replace('全文阅读', '')) ] ];
		}

		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [];

		// <table class="grid" width="100%" align="center">
		// <caption><b style="color:red;">元尊</b>搜索结果</caption>
		html.between('<table', '</table>').each_between('<tr>', '</tr>',
		// <td class="odd"><a href="https://www.x23us.com/book/69123"><b
		// style="color:red">元尊</b></a></td>
		function(text) {
			// console.log(text);
			var matched = text.match(
			//
			/<a href="[^<>"]+?\/(\d+)">([\s\S]+?)<\/a>/);
			id_list.push(+matched[1]);
			id_data.push(get_label(matched[2]));
		});

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : 'book/',
	parse_work_data : function(html, get_label, extract_work_data) {
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

		extract_work_data(work_data, html.between(' id="at">', '</table>'),
				/<th>([\s\S]+?)<\/th><td>([\s\S]+?)<\/td>/g);

		extract_work_data(work_data, html);

		html.between('<p class="widget-toc-workStatus">', '</p>')
		//
		.each_between('<span>', '</span>', function(text) {
			work_data.status.push(get_label(text));
		});

		Object.assign(work_data, {
			// 選擇性屬性：須配合網站平台更改。
			// e.g., 连载中, 連載中
			status : work_data.文章状态,
			category : work_data.文章类别,
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

		// console.log(work_data);
		return work_data;
	},
	// 對於章節列表與作品資訊分列不同頁面(URL)的情況，應該另外指定.chapter_list_URL。
	chapter_list_URL : function(work_id) {
		return 'html/' + (work_id / 1000 | 0) + '/' + work_id + '/';
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

start_crawler(crawler, typeof module === 'object' && module);
