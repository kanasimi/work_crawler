/**
 * 批量下載 動漫狂 漫畫 的工具。 Download cartoonmad comics. (comic.cmn-Hant-TW)
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

require('tls').DEFAULT_MIN_VERSION = 'TLSv1';

var crawler = new CeL.work_crawler({
	// 當有多個分部的時候才重新檢查。
	recheck : 'multi_parts_changed',

	// 圖像檔案下載失敗處理方式：忽略/跳過圖像錯誤。當404圖像不存在、檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。default:false
	skip_error : true,

	// one_by_one : true,
	base_URL : 'https://www.cartoonmad.com/',
	charset : 'big5',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return [ 'search.html', {
			keyword : work_title,
			// all:全部 ctname:作品名稱 ctag:動漫標籤 author:原創作者
			searchtype : 'all'
		} ];
	},
	parse_search_result : function(html, get_label) {
		var
		// {Array}id_list = [ id, id, ... ]
		id_list = [],
		// {Array}id_data = [ title, title, ... ]
		id_data = [];

		html = html.between('搜尋結果');

		html.each_between('<td align="center"><table ', '</table>', function(
				token) {
			var matched = token
					.match(/<a href=comic\/(\d+).html title="([^<>"]+)">/);
			id_list.push(+matched[1]);
			id_data.push(get_label(matched[2]));
		});

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'comic/' + work_id + '.html';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// <font style="font-size:14pt;">‧</font><a href=/>動漫狂</a>
		html = html.between('<a href=/>動漫狂</a>',
		// <legend>&nbsp;火影忍者漫畫線上觀看&nbsp;</legend>
		'線上觀看');

		// <b><font color="#FFFFFF">會員 <a href=/profile/MTFOX.html
		// target=_blank>MTFOX</a>
		// 發表，最後更新日期 7/2/2015 2:52:15 PM </font></b></td>
		// />([^<>]+)<\/a>[\s\n]*發表，最後更新日期([^<>]+)</
		var matched = html.match(/最後更新日期([^<>]+)</);
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between(
					'<input type="hidden" name="name" value="', '">')),

			// 選擇性屬性：須配合網站平台更改。
			last_update : new Date(matched[1])
		};

		extract_work_data(work_data, html.between('瀏覽記錄', '我要推薦').replace(
				/<span class=vstar(\d+)>/, '$1')
		// </font> &nbsp;<img src="/image/chap1.gif" align="absmiddle">
		.replace(/image\/chap([189])\.gif/, function(url, no) {
			// e.g., https://www.cartoonmad.com/image/chap1.gif
			// 5: unknown
			work_data.status = no === '1' ? '連載中' : /* 8, 9: 已載完 */'已完結';
			return '';
		}),
		// <td width="300" height="24"><img src="/image/start.gif"
		// align="absmiddle" width="4" height="8">
		// 人氣指數：
		// <span class=vstar8></span>
		/ ([^<>：]+)：([\s\S]*?)<\/td>/g);

		if (work_data.漫畫標籤) {
			// "Biorg Trinity": No .漫畫標籤
			work_data.tags = work_data.漫畫標籤.split(/\s+/);
		}

		Object.assign(work_data, {
			author : work_data.原創作者,
			收錄漫畫 : work_data.收錄漫畫.replace(/(\d+)[\s\n]+(~)[\s\n]+(\d+)/,
					'$1$2$3'),

			description : get_label(html
			// <legend>&nbsp;火影忍者簡介&nbsp;</legend>
			// <table width="800" cellspacing="8">
			// <tr>
			// <td style="font-size:11pt;">
			// ...
			// </td>
			.between('簡介&nbsp;</legend>', '</td>')
			// <td width=100><img src=/image/TICRF.jpg width=87 height=121>
			.replace('/image/TICRF.jpg', function(all) {
				work_data.is_adult = true;
				return '';
			}))
		});

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		// <legend>&nbsp;火影忍者漫畫線上觀看&nbsp;</legend>
		html = html.between('線上觀看&nbsp;</legend>',
		// 注意：有的漫畫可能還沒有任何回應
		// <b><font color="#FFFFFF">快 速 回 應 主 題</font></b></td>
		'快 速 回 應 主 題</font>');

		work_data.chapter_list = [];

		var PATTERN_chapter =
		// matched: [ all, url, 第 ? 卷/話, 頁 ]
		/<a href=([^\s]+) [^<>]*>([^<>]+)<\/a>.*?<font[^<>]*>([^<>]*)<\/font>/g
		// <td>‧<a href=/comic/102900011093001.html target=_blank>第 001
		// 卷</a>&nbsp; <font style="font-size:8pt;color:
		// #888888;">(&nbsp;93頁)</font></td>
		;

		html.each_between('<table width="800" align="center">', '</table>',
		//
		function(token) {
			var matched, part_title;
			while (matched = PATTERN_chapter.exec(token)) {
				if (!part_title) {
					part_title = matched[2].match(/([^\s])\s*$/)[1];
					this.set_part(work_data, part_title);
				}
				var chapter_data = {
					title : get_label((matched[2] + ' ' + matched[3])).replace(
							/(第)\s*(\d+)\s*/, '$1$2').replace(/\(\s+/g, '('),
					url : matched[1]
				};
				chapter_data.image_list = [];
				var image_count = +matched[3].match(/(\d+)頁/)[1];
				matched = matched[1].match(/\/(\d{4})(\d{4})/);
				matched = '/comic/comicpic.asp?file=/'
				// assert: matched[1] == work_data.id
				+ matched[1] + '/'
				// chapter_NO @see 名偵探柯南
				+ (+matched[2]).pad(3) + '/';
				for (var index = 1; index <= image_count; index++) {
					chapter_data.image_list.push(matched + index.pad(3)
					// https://www.cartoonmad.com/comic/242100012033001.html
					+ '&rimg=1'
					// + '&rimg=3'
					);
				}
				this.add_chapter(work_data, chapter_data);
			}
		}.bind(this));

		// console.log(JSON.stringify(work_data.chapter_list));
		// console.log(work_data);
		// console.log(work_data.chapter_list[0]);
	},

	skip_get_chapter_page : true
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
