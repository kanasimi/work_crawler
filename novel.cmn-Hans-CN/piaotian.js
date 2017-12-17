/**
 * 批量下載飘天文学小说阅读网(http://www.piaotian.com/)的工具。 Download piaotian novels.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// CeL.detect_HTML_language()
, 'application.locale' ]);

// ----------------------------------------------------------------------------

var PATTERN_chapter = /<div class="list">(.+)<\/div>|<a href="(\d+\.html)">(.+)<\/a>/g,
// 打廣告就算了；每個章節都要檢查這個資源檔，有些煩人了。
PATTERN_AD = /<a href="http:\/\/www\.piaotian\.com\/?(?:&[a-z]+;[^"]*)?"[^<>]*>[^<>]*<\/a>/ig,
//
crawler = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。default:false
	// recheck='changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。否則只會自上次下載過的章節接續下載。
	recheck : 'changed',

	site_name : '飘天文学',
	base_URL : 'http://www.piaotian.com/',
	charset : 'gbk',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return [ 'modules/article/search.php', {
			searchtype : 'articlename',
			searchkey : work_title
		} ];
	},
	parse_search_result : function(html, get_label) {
		html = html.between('<div id="centerm">', '</div>').between(
				'<div id="content">');
		// test: 吞噬星空,百煉成神,不存在作品
		// console.log(html);
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [], get_next_between = html.find_between(
				'<td class="odd"><a href="', '</a>'), text;

		while ((text = get_next_between()) !== undefined) {
			// 從URL網址中解析出作品id。
			var matched = text.between(null, '"').match(/([\d_]+)\.html$/);
			id_list.push(matched[1]);
			matched = text.between('>');
			id_data.push(get_label(matched));
		}

		if (id_list.length === 0
		// 本站若是找到作品就會直接跳轉，不會顯示搜尋結果。
		&& html.between('<h1>', '</h1>')) {
			text = html.between('href="' + this.base_URL + 'html/', '"');
			// 從URL網址中解析出作品id。
			var matched = text.match(/([\d_]+)(?:\/|\.html)$/);
			return [ [ matched[1] ],
					[ get_label(html.between('<h1>', '</h1>')) ] ];
		}
		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'bookinfo/' + (work_id.slice(0, -3) || 0) + '/' + work_id
				+ '.html';
	},
	parse_work_data : function(html, get_label) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			latest_chapter : get_label(html.between(
					'<span class="hottext">最新章节：</span>', '</a>')),
			description : get_label(html.between(
					'<span class="hottext">内容简介：</span>', '</td>')),
			image : html.between('<td width="80%" valign="top">').between(
					'<img src="', '"')
		};
		html.between('<h1>', '<div')
		//
		.each_between('<td', '</td>', function(text) {
			var matched = text.between('>').match(/^(.+?)：(.*?)$/);
			// console.log(matched || text);
			if (matched) {
				work_data[get_label(matched[1].replace(/(?:\s|&nbsp;)+/g, ''))]
				//
				= get_label(matched[2]) || '';
			}
		});

		work_data = Object.assign({
			// 選擇性屬性：須配合網站平台更改。
			// e.g., 连载中, 連載中
			// <span id="noveltype">完結済</span>全1部
			// <span id="noveltype_notend">連載中</span>全1部
			status : work_data.文章状态,
			author : work_data.作者,
			last_update : work_data.最后更新
		}, work_data);

		// console.log(work_data);
		return work_data;
	},
	// 對於章節列表與作品資訊分列不同頁面(URL)的情況，應該另外指定.chapter_list_URL。
	chapter_list_URL : function(work_id) {
		return 'html/' + (work_id.slice(0, -3) || 0) + '/' + work_id
				+ '/index.html';
	},
	get_chapter_count : function(work_data, html, get_label) {
		html = html.between('<div class="centent">', '<div class="bottom">');
		work_data.chapter_list = [];
		var matched, part, base_url = work_data.base_url = this
				.chapter_list_URL(work_data.id).replace(/[^\/]+$/, '');
		while (matched = PATTERN_chapter.exec(html)) {
			if (matched[1]) {
				part = get_label(matched[1]);
				if (part.includes('正文')) {
					// e.g., "正文卷"
					part = '';
				}
			} else {
				work_data.chapter_list.push({
					url : base_url + matched[2],
					part : part,
					title : get_label(matched[3]),
				});
			}
		}
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter) {
		var chapter_data = work_data.chapter_list[chapter - 1],
		// e.g., 下一章 →
		next_url = html.match(/ href="([^"]+.html)"[^<>]*>下一[章页]/),
		//
		next_chapter = work_data.chapter_list[chapter];
		// console.log(chapter + ': ' + next_url[1]);

		if (next_chapter && next_url
		//
		&& (next_url = next_url[1].replace(/^\.\//,
		// 去掉開頭的 "./"
		this.chapter_URL(work_data, chapter).replace(/[^\/]+$/, '')))
		// 有些在目錄上面的章節連結到了錯誤的頁面，只能靠下一頁來取得正確頁面。
		&& (next_chapter.url !== next_url)
		// 許多網站會把最新章節的下一頁設成章節列表，因此必須排除章節列表的網址。
		&& next_url !== 'index.html'
		// 檢查正規化規範連結之後是否與本章節相同。
		&& next_chapter.url.slice(work_data.base_url.length) !== next_url) {
			if (false) {
				CeL.info(CeL.display_align([
						[ 'chapter ' + chapter + ': ', next_chapter.url ],
						[ '→ ', next_url ] ]));
				next_chapter.url = next_url;
			}
			// insert a url
			work_data.chapter_list.splice(chapter, 0, {
				// title : '',
				url : next_url
			});
		}

		var text = html.between('</H1>');
		// e.g.,
		// http://www.piaotian.com/html/3/3596/1808085.html
		// http://www.piaotian.com/html/1/1251/576785.html
		// http://www.piaotian.com/html/0/39/5757.html
		text = text.between('\n<br>', '</div>')
		// http://www.piaotian.com/html/7/7446/4807895.html
		|| text.between('<div class="ad_content">', '<div class="bottomlink">')
		//
		.between('</div>', '</div>');

		this.add_ebook_chapter(work_data, chapter, {
			title : chapter_data.part,
			sub_title : chapter_data.title
					|| get_label(html.between('<H1>', '</H1>')),
			text : text.replace(/<script[^<>]*>[^<>]*<\/script>/g, '').replace(
					PATTERN_AD, '')
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
