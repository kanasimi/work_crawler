/**
 * 批量下載腾讯漫画的工具。 Download qq comics.
 * 
 * @see https://github.com/abcfy2/getComic
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var
/**
 * <code>
 <a target="_blank" title="剑逆苍穹：一 西域霸主" href="/ComicView/index/id/630316/cid/3">
 一 西域霸主 </a>
 <i class="ui-icon-free"></i> </span>

 <a target="_blank" title="剑逆苍穹：四十四 以快破妖" href="/ComicView/index/id/630316/cid/48">
 四十四 以快破妖 </a>
 <i class="ui-icon-pay"></i>  <i class="ui-icon-wnew"></i> </span>
 </code>
 */
// [ , full chapter title, chapter url, chapter_title, pay icon ]
PATTERN_chapter = /<a [\s\S]*?title="([^"]*)"[\s\S]*? href="([^"]+?\/cid\/\d{1,4})"[^<>]*>([\s\S]*?)<\/a>[\s\S]*?<i class="([^"]+)">/g,
//
crawler = new CeL.work_crawler({
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,
	// one_by_one : true,
	base_URL : 'https://ac.qq.com/',

	// https://github.com/kanasimi/work_crawler/issues/251
	// e.g., 630166 19天
	acceptable_types : 'png',

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// e.g., 638085 我的充电女友\0091 我会一直陪着你\638085-91-007.jpg
	// {Natural}MIN_LENGTH:最小容許圖案檔案大小 (bytes)。
	MIN_LENGTH : 200,

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		// TODO: "阿衰 on line":544410
		return 'Comic/searchList/search/'
		// e.g., 找不到"隔离带 2"，須找"隔离带"。
		+ encodeURIComponent(work_title.replace(/\s+\d+$/, '')
		// e.g., "Zero -零之镇魂曲-" → "Zero-零之镇魂曲-"
		// e.g., "七公主 第三季" → "七公主第三季"
		// e.g., "死神/境·界" → "死神境·界"
		.replace(/[ \/]+/g, '')
		// "军阀老公：沈沈要上位" → "军阀老公"
		.replace(/：.+$/g, ''));
	},
	parse_search_result : function(html) {
		var id_data = Object.create(null),
		// {Array}id_list = [id,id,...]
		id_list = [], matched, PATTERN_work_id =
		//
		/\/comicInfo\/id\/(\d+)(?:" title="([^"]+)")?/g;
		while (matched = PATTERN_work_id.exec(html)) {
			if (!id_list.includes(matched[1] |= 0)) {
				id_list.push(matched[1]);
				id_data[matched[1]] = matched[2] || '';
			}
		}
		return [ id_list, id_data ];
	},
	convert_id : {
		// 篩出今日限免 free today 本日免費. 2017/8/15 起取消了今日限免
		// e.g., `echo 今日限免： && node qq free`
		free : function(insert_id_list, get_label) {
			var _this = this;
			this.free_title = Object.create(null);

			function parse_html(XMLHttp) {
				XMLHttp.responseText.each_between('mod-tag-zt-3', '</p>',
				//
				function(token) {
					var title = token.between('title="', '"');
					if (title) {
						_this.free_title[title] = true;
					}
				});
			}

			function finish_free() {
				var id_list = [],
				//
				free_file = _this.main_directory + 'free.json',
				//
				free = CeL.get_JSON(free_file) || Object.create(null);

				for ( var title in _this.free_title) {
					if (Object.hasOwn(_this.free_title, title)) {
						id_list.push(title);
						// TODO: should use UTF+8
						free[title] = (new Date).toISOString();
					}
				}

				if (id_list.length > 0) {
					CeL.log('今日限免: ' + id_list);
				}
				if (id_list.length !== 2) {
					CeL.warn('"今日限免"作品數在 2017 CE 應該是2，但本次取得' + id_list.length);
				}
				// write cache
				CeL.write_file(free_file, free);
				insert_id_list(id_list);
			}

			// http://ac.qq.com/VIP
			CeL.get_URL(this.base_URL + 'VIP', function(XMLHttp) {
				parse_html(XMLHttp);
				CeL.get_URL(_this.base_URL, function(XMLHttp) {
					parse_html(XMLHttp);
					finish_free();
				});
			}, this.charset, null, Object.assign({
				error_retry : this.MAX_ERROR_RETRY
			}, this.get_URL_options));
		}
	},
	// id_of_search_result : function(cached_data) { return cached_data; },
	// title_of_search_result : function(data) { return data; },

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'Comic/comicInfo/id/' + work_id;
	},
	parse_work_data : function(html, get_label) {
		// work_data={id,title,author,authors,chapter_count,last_update,last_download:{date,chapter}}
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between(
					'<h2 class="works-intro-title ui-left">', '</h2>')),

			// 選擇性屬性：須配合網站平台更改。
			// e.g., "连载中"
			status : html.between('<label class="works-intro-status">',
					'</label>').trim(),
			author : get_label(html.between('"works-author-name"', '>')
					.between(' title="', '"')),
			authors :
			//
			get_label(html.between('<p class="bear-p-xone">', '</p>')),
			description : html.between('<meta name="Description" content="',
					'"'),
			latest_chapter : get_label(html.between(
					'<a class="works-ft-new" href="', '</a>').between('>')
					.replace(/^[\s\n]*\[|\][\s\n]*$/g, '')),
			latest_chapter_url : html.between('<a class="works-ft-new" href="',
					'"'),
			last_update : get_label(html.between(
					'<span class="ui-pl10 ui-text-gray6">', '</span>'))
		};

		if (this.free_title && (work_data.title in this.free_title)) {
			// 將今日限免作品移至特殊目錄下。
			work_data.base_directory_name = 'free';
			work_data.directory_name_extension = '.'
					+ (new Date).format('%Y%2m%2d');
		}

		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		work_data.chapter_list = [];
		var matched;
		// console.log(html);
		html = html.between('<ol class="chapter-page-all works-chapter-list">',
				'</ol>');
		// 有些作品如"演平乱志"之類，章節並未按照編號排列。
		while (matched = PATTERN_chapter.exec(html)) {
			// [ , full chapter title, chapter url, chapter_title, pay icon ]
			work_data.chapter_list.push({
				title : get_label(matched[3]),
				url : matched[2],
				limited : matched[4].endsWith('pay')
			});
		}
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// decode chapter data
		// 2018/11/2-7 之間改版
		// modify from
		// http://ac.gtimg.com/media/js/ac.page.chapter.view_v2.4.0.js?v=20170622
		function decode(T, N) {
			function Base() {
				var _keyStr =
				//
				"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
				//
				;
				this.decode = function(c) {
					var a = "", b, d, h, f, g, e = 0;
					c = c.replace(/[^A-Za-z0-9\+\/\=]/g, "");
					for (; e < c.length;) {
						b = _keyStr.indexOf(c.charAt(e++));
						d = _keyStr.indexOf(c.charAt(e++));
						f = _keyStr.indexOf(c.charAt(e++));
						g = _keyStr.indexOf(c.charAt(e++));
						b = b << 2 | d >> 4;
						d = (d & 15) << 4 | f >> 2;
						h = (f & 3) << 6 | g;
						a += String.fromCharCode(b);
						64 != f && (a += String.fromCharCode(d));
						64 != g && (a += String.fromCharCode(h));
					}
					return a = _utf8_decode(a)
				}
				function _utf8_decode(c) {
					for (var a = "", b = 0, d = 0, c2, c3; b < c.length;) {
						d = c.charCodeAt(b);
						if (128 > d) {
							a += String.fromCharCode(d);
							b++
						} else if (191 < d && 224 > d) {
							c2 = c.charCodeAt(b + 1);
							a += String.fromCharCode((d & 31) << 6 | c2 & 63);
							b += 2
						} else {
							c2 = c.charCodeAt(b + 1);
							c3 = c.charCodeAt(b + 2);
							a += String.fromCharCode((d & 15) << 12
									| (c2 & 63) << 6 | c3 & 63);
							b += 3;
						}
					}
					return a
				}
			}
			var B = new Base(), len, locate, str;
			T = T.split('');
			N = N.match(/\d+[a-zA-Z]+/g);
			// console.log(N);
			len = N.length;
			while (len--) {
				locate = parseInt(N[len]) & 255;
				str = N[len].replace(/\d+/g, '');
				T.splice(locate, str.length)
			}
			T = T.join('');
			// console.log(T);
			// console.log(B.decode(T));
			return JSON.parse(B.decode(T));
		}

		var chapter_data = html.match(/\sDATA\s*=\s*'([^']{32,})'/),
		//
		chapter_nonce, matched, PATTERN_nonce =
		// 2018/11/7: "window.nonce = '...'"
		//
		// 2018/11/15: 第一個指定可能是障眼法 fake
		// "window.nonce = '' + '...';"
		// window["non"+"ce"]="..."+(+eval("...")).toString()+(+eval("Math.round(.5)+~~1.5")).toString();
		/window\s*(?:\.\s*nonce|\[([nonce"'\s+]+)\])\s*=(.{32,})/g;

		// node qq 热血学霸
		// console.log(html);
		while (matched = PATTERN_nonce.exec(html)) {
			// delete matched.input;
			// console.log(matched);
			if (!matched[1] || matched[1].replace(/['"\s+]/g, '') === 'nonce')
				chapter_nonce = matched[2];
		}
		chapter_nonce = chapter_nonce.replace(
		// (+eval("!!document.getElementsByTagName('html')")).toString()
		/document\.getElementsByTagName\([^()]+\)/g, '[{}]');
		try {
			chapter_nonce = eval(chapter_nonce);
		} catch (e) {
			// qq: 有時取得的網頁包含錯誤，重新取得一次便可成功解析。
			return this.REGET_PAGE;
		}

		// for debug
		if (false) {
			if (chapter_nonce)
				CeL.info('nonce: ' + chapter_nonce);
			else
				console.log(html);
		}

		// assert: nonce.length === 32
		try {
			if (!chapter_data || !(chapter_data =
			// maybe: "Unexpected token & in JSON"
			decode(chapter_data[1], chapter_nonce)) || !chapter_data.picture) {
				return;
			}
		} catch (e) {
			return this.REGET_PAGE;
		}
		// console.log(chapter_data);

		// 設定必要的屬性。
		chapter_data.title = chapter_data.chapter.cTitle;
		// chapter_data.image_count = chapter_data.picture.length;

		// @see this.is_limited_image_url(image_url) @ work_crawler/chapter.js
		if (chapter_data.picture[0].url.includes(
		// 處理特殊圖片: 有些漫畫的最新話會設定只在APP觀看 會取得
		// https://manhua.qpic.cn/manhua_detail/0/14_11_10_a1827afc3b8d37cfd3f7242cc713f5751_109708576.png/0
		'/14_11_10_a1827afc3b8d37cfd3f7242cc713f5751_109708576.png')) {
			// assert: chapter_data.picture[0].pid === 16111
			chapter_data.limited = true;
			this.set_start_chapter_NO_next_time(work_data, chapter_NO);
		} else {
			// 正常情況。
			chapter_data.image_list = chapter_data.picture;

			chapter_data.limited = !chapter_data.chapter.canRead;
		}

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

// https://github.com/abcfy2/getComic/issues/20
// cookie中包含 uin和skey就可以下載到收費漫畫
start_crawler(crawler, typeof module === 'object' && module);
