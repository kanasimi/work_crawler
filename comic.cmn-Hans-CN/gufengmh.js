/**
 * 批量下載古风漫画网的工具。 Download GuFengMH.Com comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 本站常常無法取得圖片，因此得多重新檢查。
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。
	// recheck : true,
	// one_by_one : true,

	base_URL : 'http://www.gufengmh.com/',

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// 提取出引數（如 URL）中的作品ID 以回傳。
	extract_work_id : function(work_information) {
		return /^[a-z]+$/.test(work_information) && work_information;
	},

	// 取得伺服器列表。
	// use_server_cache : true,
	server_URL : 'js/config.js',
	parse_server_list : function(html) {
		var server_list = [], SinConf;
		eval(html.replace('var ', '').replace(/(}\(\))[\s\S]*/, '$1'));
		SinConf.resHost.map(function(data) {
			server_list.append(data.domain.map(function(host) {
				return host.endsWith('/') ? host : host + '/';
			}));
		});
		server_list = server_list.unique();
		server_list.conf = SinConf;
		// console.log(SinConf);
		return server_list;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		// SinConf.apiHost
		return [ 'http://api.gufengmh.com/comic/search', {
			keywords : work_title
		} ];
	},
	parse_search_result : function(html) {
		/**
		 * e.g.,<code>
		{"items":[{"id":3542,"status":1,"commend":0,"is_original":0,"is_vip":0,"name":"军阀霸宠：纯情妖女火辣辣","title":"民国妖闻录","alias":"","original_name":"","letter":"j","slug":"junfabachongchunqingyaonuhuolala","coverUrl":"http://res.gufengmh.com/images/cover/201711/1509877682Xreq-5mrrSsDm82P.jpg","uri":"/manhua/junfabachongchunqingyaonuhuolala/","last_chapter_name":"040：纯良少年的堕落","last_chapter_id":235075,"author":"逐浪动漫","author_id":3901,"serialise":1}],"_links":{"self":{"href":"http://api.gufengmh.com/comic/search?page=1"}},"_meta":{"totalCount":1,"pageCount":1,"currentPage":1,"perPage":20},"status":0}
		 </code>
		 */
		var id_data = html ? JSON.parse(html) : [];
		return [ id_data.items.map(function(data) {
			return data.slug;
		}), id_data.items ];
	},
	// id_of_search_result : 'slug',
	title_of_search_result : 'title',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'manhua/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, exact_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			description : get_label(html.between('intro-all', '</div>')
					.between('>'))
		}, data = html.between('detail-list', '</ul>');
		exact_work_data(work_data, data,
		// e.g., "<strong>漫画别名：</strong>暂无</span>"
		/<strong[^<>]*>([^<>]+)<\/strong>(.+?)<\/span>/g);

		Object.assign(work_data, {
			author : work_data.漫画作者,
			status : work_data.漫画状态,
			last_update : work_data.更新时间
		});
		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		var chapter_block, chapter_list = [], PATTERN_chapter_block =
		//
		/class="chapter-body[^<>]+>([\s\S]+?)<\/div>/g;
		while (chapter_block = PATTERN_chapter_block.exec(html)) {
			chapter_block = chapter_block[1];
			var link, PATTERN_chapter_link =
			//
			/<a href="([^<>"]+)"[^<>]*>([\s\S]+?)<\/a>/g;
			while (link = PATTERN_chapter_link.exec(chapter_block)) {
				if (link[1].startsWith('javascript:')) {
					// 本站应《 》版权方要求现已屏蔽删除本漫画所有章节链接，只保留作品文字信息简介以及章节目录
					continue;
				}
				var chapter_data = {
					url : link[1],
					title : get_label(link[2])
				};
				chapter_list.push(chapter_data);
			}
		}
		// console.log(chapter_list);
		if (chapter_list.length === 0
				&& (html = html.between('class="ip-body">', '</div>'))) {
			CeL.warn(get_label(html));
		}
		work_data.chapter_list = chapter_list;
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data = CeL.null_Object();
		eval(html.between('<script>', '</script>').replace(/;var /g,
				';chapter_data.'));
		if (!chapter_data) {
			CeL.warn(work_data.title + ' #' + chapter_NO
					+ ': No valid chapter data got!');
			return;
		}

		// 設定必要的屬性。
		chapter_data.title = get_label(html.between('<h2>', '</h2>'));
		// e.g., 'images/comic/4/7592/'
		var path = encodeURI(chapter_data.chapterPath);
		chapter_data.image_list = chapter_data.chapterImages.map(function(url) {
			return {
				// e.g., 外挂仙尊 184 第76话
				// 但是這還是沒辦法取得圖片...
				url : /^https?:\/\//.test(url) ? url : path + url
			}
		});

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
