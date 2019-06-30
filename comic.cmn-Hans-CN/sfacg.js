/**
 * 批量下載 SF漫画 的工具。 Download sfacg comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var PATTERN_part = /<ul class="content_Tab whitefont".*?>(.+?)<\/ul>[\s\n]*<div class="comic_Serial_list">([\s\S]+?)<\/div>/g,
//
crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 當有多個分部的時候才重新檢查。
	recheck : 'multi_parts_changed',

	// 圖像檔案下載失敗處理方式：忽略/跳過圖像錯誤。當404圖像不存在、檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。default:false
	skip_error : true,

	// one_by_one : true,
	base_URL : 'https://manhua.sfacg.com/',

	// 規範 work id 的正規模式；提取出引數中的作品id 以回傳。
	extract_work_id : function(work_information) {
		if (/^[a-z\d]+$/i.test(work_information))
			return work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		// t=0: 漫画, t=1: 轻小说
		return [ 'http://s.sfacg.com/ajax/GetRelateWord.ashx?a=1&t=0', {
			keyword : work_title
		} ];
	},
	parse_search_result : function(html, get_label) {
		// console.log(html);
		html = JSON.parse(html);
		return [ html.map(function(data) {
			return data.url.match(/\/([^\/]+)\/$/)[1];
		}), html ];
	},
	title_of_search_result : 'clearTitle',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'mh/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// console.log(html);
		var text = html
				.between('</h1>', '<div class="Content_block font_red">'),
		//
		work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			收藏 : html.between('id="Mark2Pocket">').between('<small>',
					'</small>'),
			赞 : html.between('id="DoLike">').between('<small>', '</small>'),
			// <span>总评分：</span>很好，公认的佳作<br />
			// <span class="star2_bg" style="float:left;"><span class="star2"
			// style="width:171px;"></span></span><strong>9.5</strong>
			总评分 : html.between('<span class="star2"').between('<strong>',
					'</strong>')
		};

		extract_work_data(work_data, text.between('<span class="broken_line"',
				'</li>'),
		//
		/<span>([^<>：]+)：<\/span>([\s\S]*?)(?=<span>|<div)/g);

		Object.assign(work_data, {
			description : get_label(text
			// <span class="broken_line" style="margin:7px
			// 0;width:434px;"></span>
			.between('<ul class="synopsises_font">',
					'<span class="broken_line"').replace(work_data.title, '')),

			author : work_data.作者,
			last_update : work_data.更新时间
		});

		var matched = work_data.最新连载.match(/^(.+)\[([^\[\]]+)\]$/);
		if (matched) {
			work_data.latest_chapter = matched[1];
			work_data.status = matched[2];
		}

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between('漫画连载</span>', '<div class="content_left2">');

		work_data.chapter_list = [];
		work_data.chapter_list.part_NO = 0;

		var matched;
		while (matched = PATTERN_part.exec(html)) {
			work_data.chapter_list.part_NO++;
			var part_title = get_label(matched[1]), text = matched[2],
			// e.g., 请别告诉我这是三国正史！ 空想神曲IDOLING
			PATTERN_chapter = /<a href="(.+?)".*?>(.+?)<\/a>/g;
			while (matched = PATTERN_chapter.exec(text)) {
				var chapter_data = {
					part_title : part_title,
					url : matched[1],
					title : get_label(matched[2])
				};
				work_data.chapter_list.unshift(chapter_data);
			}
		}
		// console.log(JSON.stringify(work_data.chapter_list));
		// console.log(work_data);
	},

	pre_parse_chapter_data
	// 執行在解析章節資料 process_chapter_data() 之前的作業 (async)。
	// 必須自行保證執行 callback()，不丟出異常、中斷。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		//
		html = XMLHttp.responseText, _this = this;

		html.between('<script language="javascript">', '</script>');

		chapter_data.page_variables = Object.create(null);

		var matched, PATTERN_assignment =
		// [ expression, variable name, value, quote ]
		/\svar\s+([a-zA-Z\d_]+)\s*=\s*(\d+|true|false|(["'])(?:\\.|[^\\"']+)*\3)/g
		// @see dm5.js
		;
		while (matched = PATTERN_assignment.exec(html)) {
			// console.log(matched);
			chapter_data.page_variables[matched[1]] = JSON
					.parse(matched[3] === "'" ? matched[2].replace(
							/^'([\s\S]*?)'$/g, function(all, inner) {
								return '"' + inner.replace(/"/g, '\\"') + '"';
							}) : matched[2]);
		}

		matched = html.match(
		// e.g., "//comic.sfacg.com/Utility/1951/ZP/001.js"
		/<script .*?src="(\/\/comic\.sfacg\.com\/Utility\/[^"]+\.js)"><\/script>/
		// "//comic.sfacg.com/Utility/" + .c + "/" + .fn + "/" + .nv + ".js"
		)[1];
		matched = 'https:' + matched;

		this.get_URL(matched, function(XMLHttp) {
			try {
				html = XMLHttp.responseText.replace(/var picAy/,
						'chapter_data.image_list').replace(/picAy(\[\d+\])/g,
						'chapter_data.image_list$1').replace(/var\s/g,
						'chapter_data.');
				eval(html);
			} catch (e) {
				// for 山海无极 #23
				if (this.skip_error)
					CeL.error(html);
				else
					this.onerror(e, work_data);
				callback();
				return;
			}
			chapter_data.image_list = chapter_data.image_list
					.map(function(url) {
						return encodeURI(chapter_data.hosts[0] + url);
					});
			callback();
		});
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		// console.log(chapter_data);

		// 已在 pre_parse_chapter_data() 設定完 {Array}chapter_data.image_list
		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
