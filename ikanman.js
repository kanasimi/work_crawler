/**
 * 批量下載爱看漫画的工具。 Download ikanman comics.
 */

'use strict';

require('./comic loder.js');

// ----------------------------------------------------------------------------

var ikanman = new CeL.comic.site({
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,
	// one_by_one : true,

	base_URL : 'http://www.ikanman.com/',

	// allow .jpg without EOI mark.
	allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	skip_error : true,

	// 取得伺服器列表。
	use_server_cache : true,
	server_URL : function() {
		return 'http://c.3qfm.com/scripts/'
				+ 'core_9D227AD5A911B7758A332C9CA35C640C.js';
	},
	parse_server_list : function(html) {
		var server_list = [];
		eval(html.between('var servs=', ',pfuncs=')).forEach(function(data) {
			data.hosts.forEach(function(server_data) {
				// @see SMH.utils.getPath
				server_list.push(server_data.h + '.hamreus.com:8080');
			});
		});
		return server_list;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : '/support/word.ashx?key=',
	parse_search_result : function(html) {
		/**
		 * e.g.,<code>
		[ { "t": "西游", "u": "/comic/17515/", "s": false, "cid": 272218, "ct": "第72话：一虎进击", "a": "郑健和,邓志辉" } ]
		 </code>
		 */
		var id_data = html ? JSON.parse(html) : [];
		return [ id_data, id_data ];
	},
	id_of_search_result : function(search_result) {
		// e.g., "/comic/123/"
		return +search_result.u.match(/^\/comic\/(\d+)\/$/)[1];
	},
	title_of_search_result : 't',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return this.base_URL + 'comic/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, exact_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			status : get_label(html.between('<li class="status">', '</span>')
					.between('</strong>')),
			sub_title : get_label(html.between('<h1>', '</div>').between(
					'</h1>')),
			description : get_label(html.between('intro-all', '</div>')
					.between('>'))
		}, data = html.between('detail-list', '</ul>');
		exact_work_data(work_data, data,
		// e.g., "<strong>漫画别名：</strong>暂无</span>"
		/<strong[^<>]*>([^<>]+)<\/strong>(.+?)<\/span>/g);
		if (data = get_label(data.between('<li class="status">', '</li>'))) {
			CeL.log(data);
		}
		return work_data;
	},
	get_chapter_count : function(work_data, html) {
		var chapter_list = [], matched,
		/**
		 * e.g., <code>
		<li><a href="/comic/17515/272218.html" title="第72话：一虎进击" class="status0" target="_blank"><span>第72话：一…<i>31p</i><em class="new"></em></span></a></li>
		</code>
		 */
		PATTERN_chapter =
		// [:]: incase href="javascript:;"
		// [ all, href, title, inner ]
		/<li><a href="([^"<>:]+)" title="([^"<>]+)"[^<>]*>(.+?)<\/a><\/li>/g,
		// @see http://www.ikanman.com/comic/8928/
		data = html.between('chapter-list', '<script ');
		while (matched = PATTERN_chapter.exec(data)) {
			matched[2] = matched[2].trim();
			if (matched[3] = matched[3].between('<i>', '</i>')) {
				matched[2] = matched[2] + ' ' + matched[3];
			}
			var chapter_data = {
				url : matched[1],
				title : matched[2]
			};
			if (matched = matched[1].match(/(\d+)\.html$/)) {
				chapter_data.id = +matched[1];
			} else {
				chapter_list.some_without_id = chapter_data;
			}
			chapter_list.push(chapter_data);
		}
		if (chapter_list.length === 0
		// e.g., <div class="book-btn"><a href="/comic/8772/86612.html"
		// target="_blank" title="1话" class="btn-read">开始阅读</a>
		&& (data = html.between('book-btn', '</a>'))) {
			// 尊敬的看漫画用户，应《》版权方的要求，现已删除屏蔽《》漫画所有卷和册，仅保留作品文字简介
			this.pre_chapter_URL = this._pre_chapter_URL;
			if (Array.isArray(work_data.chapter_list)
					&& work_data.chapter_list.length > 1) {
				work_data.last_download.chapter
				// use cache (old data)
				= work_data.chapter_list.length;
			} else {
				work_data.chapter_list = [ {
					url : data.match(/ href="([^<>"]+)"/)[1],
					title : data.match(/ title="([^<>"]+)"/)[1]
				} ];
			}
			chapter_list = work_data.chapter_list;
		} else {
			if (chapter_list.length > 1) {
				// 轉成由舊至新之順序。
				if (chapter_list.some_without_id) {
					CeL.warn('有些篇章之URL檔名非數字: '
							+ JSON.stringify(chapter_list.some_without_id));
					chapter_list = chapter_list.reverse();
				} else {
					chapter_list = chapter_list.sort(function(a, b) {
						// 排序以.html檔案檔名(序號)為準。
						// assert: 後來的檔名，序號會比較大。
						// @see http://www.ikanman.com/comic/8928/
						return a.id < b.id ? -1 : 1;
					});
				}
			}
			// console.log(chapter_list.slice(0, 20));
			// console.log(chapter_list.slice(-20));
			work_data.chapter_list = chapter_list;
		}
		work_data.chapter_count = chapter_list.length;
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	_pre_chapter_URL : function(work_data, chapter, callback) {
		// console.log(chapter_data);
		var chapter_data = work_data.chapter_list[chapter - 1],
		// e.g., "/comic/8772/86612.html"
		chapter_id = +chapter_data.url.match(/^\/comic\/\d+\/(\d+)\.html$/)[1];
		CeL.get_URL(this.base_URL + 'support/chapter.ashx?bid=' + work_data.id
				+ '&cid=' + chapter_id, function(XMLHttp) {
			chapter_data.sibling = JSON.parse(XMLHttp.responseText);
			if (chapter_data.sibling.n > 0
					&& work_data.chapter_count === chapter) {
				// 還有下一chapter。
				work_data.chapter_list.push({
					url : chapter_data.url.replace(/(\d+)\.html$/,
							chapter_data.sibling.n + '.html')
				});
				work_data.chapter_count = work_data.chapter_list.length;
			}
			callback();
		}, null, null, this.get_URL_options);
	},
	chapter_URL : function(work_data, chapter) {
		// console.log(work_data.chapter_list);
		return this.base_URL + work_data.chapter_list[chapter - 1].url;
	},
	parse_chapter_data : function(html, work_data, get_label) {
		// decode chapter data
		function decode(code) {
			code = eval(code);
			eval(code.replace('eval', 'code='));
			eval(code.replace(/^[^=]+/, 'code'));
			return code;
		}

		var chapter_data = html.between('<script type="text/javascript">eval',
				';</script>');
		if (!chapter_data || !(chapter_data = decode(chapter_data))) {
			return;
		}

		// 設定必要的屬性。
		chapter_data.title = chapter_data.cname;
		chapter_data.image_count = chapter_data.len;
		// e.g., "/ps3/q/qilingu_xmh/第01回上/"
		var path = encodeURI(chapter_data.path);
		chapter_data.image_list = chapter_data.files.map(function(url) {
			return {
				url : path + url
				// @see
				// http://c.3qfm.com/scripts/core_9D227AD5A911B7758A332C9CA35C640C.js
				.replace(/\.webp$/, '')
			}
		});

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

var decryptDES;
CeL.get_URL_cache(
//
'http://c.3qfm.com/scripts/config_F31AF4311D4D987EC68AD2E90224F946.js',
//
function(contents) {
	contents = contents.between('\n', 'var pVars').replace(
			'eval(function(n,t,i,r,u,f)',
			'eval("decryptDES="+function(n,t,i,r,u,f)')
			+ ';global.decryptDES=decryptDES;';
	eval(contents);
	ikanman.start(work_id);
}, ikanman.main_directory + 'decoder.js');
