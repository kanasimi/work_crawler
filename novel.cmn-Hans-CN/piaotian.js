/**
 * 批量下載飘天文学小说阅读网(http://www.piaotian.com/)的工具。 Download piaotian novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// CeL.detect_HTML_language()
, 'application.locale' ]);

// ----------------------------------------------------------------------------

// for Error: unable to verify the first certificate
// code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// 章節以及篇章連結的模式。
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
	// recheck : 'changed',

	// 下載每個作品更換一次 user agent。
	regenerate_user_agent : 'work',

	site_name : '飘天文学',
	// 2018: http://www.piaotian.com/
	// 2019/11/23 前改為: https://www.ptwxz.com/
	base_URL : 'https://www.ptwxz.com/',
	charset : 'gbk',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return [ 'modules/article/search.php', {
			searchtype : 'articlename',
			searchkey : work_title
		} ];
	},
	parse_search_result : function(html, get_label) {
		// console.log(html);
		if (html.includes('<span class="hottext">最新章节：</span>')) {
			// 只有一個作品完全符合，直接 redirects 引導到了作品資訊頁面。
			var matched = html.match(/ href="[^<>"]+?\/\d{1,2}\/(\d{1,5})\/"/);
			// console.log(matched);
			return [ [ matched[1] ],
					[ get_label(html.between('<h1>', '</h1>')) ] ];
		}

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
		// piaotian 有時會 502，但是重新再擷取一次就可以了。
		if (work_data.title === '502 Bad Gateway') {
			return this.REGET_PAGE;
		}

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

		// console.log(html);
		// console.log(work_data);
		return work_data;
	},
	// 對於章節列表與作品資訊分列不同頁面(URL)的情況，應該另外指定.chapter_list_URL。
	chapter_list_URL : function(work_id) {
		return 'html/' + (work_id.slice(0, -3) || 0) + '/' + work_id
				+ '/index.html';
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between('<div class="centent">', '<div class="bottom">');
		work_data.chapter_list = [];
		var matched, part_title, base_url = work_data.base_url = this
				.chapter_list_URL(work_data.id).replace(/[^\/]+$/, '');
		while (matched = PATTERN_chapter.exec(html)) {
			if (matched[1]) {
				part_title = get_label(matched[1]);
				if (part_title.includes('正文')) {
					// e.g., 《...》正文卷
					part_title = '';
				}
				// console.log(part_title);

			} else {
				var chapter_data = {
					url : base_url + matched[2],
					part_title : part_title,
					title : get_label(matched[3]),
				};
				work_data.chapter_list.push(chapter_data);
			}
		}
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);
		// 在取得小說章節內容的時候，若發現有章節被目錄漏掉，則將之補上。
		this.check_next_chapter(work_data, chapter_NO, html);

		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		//
		text = html.between('</H1>');
		// e.g.,
		// http://www.piaotian.com/html/3/3596/1808085.html
		// http://www.piaotian.com/html/1/1251/576785.html
		// http://www.piaotian.com/html/0/39/5757.html
		text = text.between('\n<br>', '</div>')
		// http://www.piaotian.com/html/7/7446/4807895.html
		|| text.between('<div class="ad_content">', '<div class="bottomlink">')
		//
		.between('</div>', '</div>');

		text = text
		// 去除掉 <script> 功能碼。
		.replace(/<script[^<>]*>[^<>]*<\/script>/g, '')

		// 琥珀之剑 第四卷 第二百八十九幕 时间的长度 https://www.ptwxz.com/html/2/2827/1322197.html
		.replace(/&lt;a href=&quot;[\x20-\xff]+&lt;\/a&gt;(?:<\/a>)*/, '')

		// 去除掉廣告。
		.replace(PATTERN_AD, '')
		// 咫尺之间人尽敌国 第一千零四章 神国 https://www.ptwxz.com/html/10/10231/7979150.html
		.replace(/水印广告测试(?:&nbsp;)*/g, '')

		// 一品修仙 正文 第二四三章 我不是幻觉，不信你捅我一剑试试
		// https://www.ptwxz.com/html/9/9503/6476110.html
		// 一品修仙 正文 第三六四章 黎族的大佬套路深，还没动手他就快完蛋了
		// https://www.ptwxz.com/html/9/9503/6750266.html
		// <br /><br />&nbsp;&nbsp;&nbsp;&nbsp;https:
		// <br /><br />&nbsp;&nbsp;&nbsp;&nbsp;天才本站地址：。m.
		// .replace('https:<br', '<br').replace('天才本站地址：。m.', '')
		;
		// console.log(text);

		this.add_ebook_chapter(work_data, chapter_NO, {
			title : chapter_data.part_title,
			sub_title : chapter_data.title
					|| get_label(html.between('<H1>', '</H1>')),
			text : text
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
