/**
 * 批量下載快看漫画的工具。 Download kuaikanmanhua comics.
 * 
 * @since 2018/10/20-11/8 改版. 2019/4/7-12 快看漫画改版，重寫程式碼。
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,
	// one_by_one : true,
	base_URL : 'https://www.kuaikanmanhua.com/',

	// 最小容許圖案檔案大小 (bytes)。
	// 對於極少出現錯誤的網站，可以設定一個比較小的數值，並且設定.allow_EOI_error=false。因為這類型的網站要不是無法取得檔案，要不就是能夠取得完整的檔案；要取得破損檔案，並且已通過EOI測試的機會比較少。
	// 對於有些圖片只有一條細橫桿的情況。
	MIN_LENGTH : 150,

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title, get_label) {
		return 'v1/search/topic?q=' + encodeURIComponent(work_title)
				+ '&since=0&size=20&f=3';
	},
	parse_search_result : function(html, get_label) {
		html = JSON.parse(html).data.hit;
		return [ html, html ];
	},
	id_of_search_result : 'id',
	title_of_search_result : 'title',

	search_URL_web : 's/result/',
	parse_search_result_web : function(html, get_label) {
		html = html.between('<div class="resultList cls">',
		// <div class="footerBox"><div class="Footer">
		'<div class="footerBox">');

		var id_list = [], id_data = [];
		/**
		 * <code>
		</p> <div class="resultList cls"><div class="TabW184 fl padding16"><a href="https://www.kuaikanmanhua.com/web/topic/3131" target="_blank" class="link  ">
		</code>
		 */
		html.split('<div class="TabW184').forEach(function(token, index) {
			var title = token.between('<span class="itemTitle">', '</span>');
			if (!title) {
				// Skip the first one.
				return;
			}
			id_data.push(title);
			var id = token.match(/<a [\s\S]*?href="[^<>"]+\/(\d+)"/);
			id_list.push(id[1]);
		});

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'web/topic/' + work_id;
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h3 class="title">', '</h3>')),
			author : get_label(html.between('<div class="nickname">',
			//
			'</div>')),

		// 選擇性屬性：須配合網站平台更改。
		// 2019/3: 总热度 <span class="hot-num">12.83亿</span>, 2019/4: 人气值
		};
		// extract_work_data(work_data, html);

		html = eval(html
		//
		.between('<script>window.__NUXT__=', ';</script>')).data[0];
		Object.assign(work_data, html.topicInfo);
		work_data.chapter_list = html.comics.reverse().map(
				function(chapter_data) {
					chapter_data.url = 'web/comic/' + chapter_data.id;
					if (chapter_data.locked)
						chapter_data.limited = true;
					return chapter_data;
				});
		// console.log(work_data);
		return work_data;
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		html = eval(html
		//
		.between('<script>window.__NUXT__=', ';</script>')).data[0];

		var chapter_data = work_data.chapter_list[chapter_NO - 1];

		chapter_data.image_list = html.comicInfo.comicImages;
		// delete html.comicInfo.comicImages;

		// `comicInfo` 的資訊較不精確!
		// Object.assign(chapter_data, html.comicInfo);
		// console.log(chapter_data);

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
