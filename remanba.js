/**
 * 批量下載热漫吧网站的工具。 Download remanba comics.
 */

'use strict';

require('./comic loder.js');

// ----------------------------------------------------------------------------

var remanba = new CeL.comic.site({
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,
	// one_by_one : true,

	// http://www.reman8.com/
	base_URL : 'http://www.remanba.com/',

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// 取得伺服器列表。
	// use_server_cache : true,
	server_URL : function() {
		return this.base_URL + 'template/v2/js/configs.js';
	},
	parse_server_list : function(html) {
		return JSON.parse(
		//
		html.replace(/^[^{]+/, '').replace(/[^}]+$/, '')
		//
		.replace(/,[\s\n]*'IMG_ERR_MSG'[\s\S]+$/, '}')
		//
		.replace(/'/g, '"')).servs
		//
		.map(function(server_data) {
			return server_data.host;
		});
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return this.base_URL + '/plus/ac.php?from=web&cs=utf-8&k='
		// e.g., 找不到"隔离带 2"，須找"隔离带"。
		+ encodeURIComponent(work_title.replace(/\s+\d+$/, '')
		// "七公主 第三季" → search "七公主"
		.replace(/\s+(.*)$/, ''));
	},
	parse_search_result : function(html) {
		/**
		 * e.g.,<code>
		compResp("深渊", new Array("白色深渊","蝴蝶深渊","无限深渊~梦物语~","深渊幻象","深渊","深渊之塔","白色深渊","深渊","深渊边境","深渊骑士"), new Array("comic_106393","comic_117847","comic_122570","comic_124693","comic_126005","comic_126749","comic_127741","comic_143631","comic_149749","comic_150918"), new Array("","","","","","","","","",""));
		 </code>
		 */
		var id_data = html ? JSON.parse(html.replace(/^.+?\(/, '[').replace(
				/\)[^()]*$/, ']').replace(/new Array\((.*?)\)/g, '[$1]')) : [];
		return [ id_data[2], id_data[1] ];
	},
	// id_of_search_result : '',
	// title_of_search_result : '',
	post_get_work_id : function(callback, work_title, search_result) {
		CeL.get_URL(this.base_URL + 'plus/ac_comic.php?t=get_comic_info&id='
				+ search_result[work_title].replace(/^comic_/, ''), function(
				XMLHttp) {
			var matched = XMLHttp.responseText;
			if (matched
			//
			&& (matched = matched.match(/titleurl='([^']+)'/))) {
				matched = matched[1].match(/([^\/]+)\/$/);
			}
			search_result[work_title] = matched && matched[1];
			callback();
		});
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return this.base_URL + 'comic/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, exact_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : html.between(
					'<meta property="og:novel:book_name"content="', '"/>'),

			// 選擇性屬性：須配合網站平台更改。
			// <meta property="og:novel:status" content="已完结"/>
			status : html.between('<meta property="og:novel:status"content="',
					'"/>'),
			description : get_label(html.between(
					'</p><p class="movieintro"id="comic_intro_l">', '<div '))
		};
		exact_work_data(work_data, html.between('<ul class="movieinfo">',
				'</ul>'), /<li[^<>]*>([^:]+):(.+?)<\/li>/g);
		return work_data;
	},
	get_chapter_count : function(work_data, html) {
		work_data.chapter_list = [];
		var matched,
		/**
		 * e.g., <code>
		<li class="info_li"><a href="http://www.remanba.com/comic/ShenYuanBianJing/401349.html"target="_blank">01话.融化的尸体</a></li>
		</code>
		 */
		PATTERN_chapter =
		// [all,href,title]
		/<li class="info_li"><a href="([^<>"]+)"(?:[^<>]*)>([^<>]+)<\/a>/g;
		html = html.between('scrollcontain', 'box_tt_tab');
		while (matched = PATTERN_chapter.exec(html)) {
			work_data.chapter_list.push({
				url : matched[1],
				title : matched[2].trim()
			});
		}
		work_data.chapter_count = work_data.chapter_list.length;
		if (work_data.chapter_count > 1) {
			// 轉成由舊至新之順序。
			work_data.chapter_list = work_data.chapter_list.reverse();
		}
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter) {
		return work_data.chapter_list[chapter - 1].url;
	},
	parse_chapter_data : function(html, work_data, get_label) {
		// decode chapter data
		function decode(code) {
			code = eval(code).replace(/^[^=]+/, 'code');
			return eval(code);
		}

		var chapter_data = html.between('<script type="text/javascript">eval',
				';</script>');
		if (!chapter_data || !(chapter_data = decode(chapter_data))) {
			return;
		}

		// 設定必要的屬性。
		chapter_data.title = chapter_data.cname;
		chapter_data.image_count = chapter_data.len;
		chapter_data.image_list = chapter_data.files.map(function(url) {
			return {
				url : url
			}
		});

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

remanba.start(work_id);
