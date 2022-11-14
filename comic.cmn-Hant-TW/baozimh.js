/**
 * 批量下載包子漫畫的工具。 Download baozimh comics.
 * 
 * @since 2022/11/3 5:55:24
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

/**
 * <code>
 <a href="/user/page_direct?comic_id=yuanlaiwoshixiuxiandalao-luanshijiaren&amp;section_slot=0&amp;chapter_slot=0" rel="noopener" class="comics-chapters__item" data-v-0c0802bc><div style="flex: 1;" data-v-0c0802bc><span data-v-0c0802bc>預告</span></div></a>
 <code>
 */
var PATTERN_chapter_link = /<a [^<>]*?href="([^<>"]+?)" [^<>]* class="comics-chapters__item"[^<>]*>([\s\S]+?)<\/a>/g;

var crawler = new CeL.work_crawler({

	// one_by_one : true,
	base_URL : 'https://www.baozimh.com/',

	// 最小容許圖案檔案大小 (bytes)。
	// 對於極少出現錯誤的網站，可以設定一個比較小的數值，並且設定.allow_EOI_error=false。因為這類型的網站要不是無法取得檔案，要不就是能夠取得完整的檔案；要取得破損檔案，並且已通過EOI測試的機會比較少。
	// 對於有些圖片只有一條細橫桿的情況。
	// MIN_LENGTH : 150,

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	acceptable_types : 'webp|jpg',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search?q=',
	parse_search_result : function(html, get_label) {
		html = html.between('<div class="pure-g classify-items">');
		// console.log(html);
		var id_list = [], id_data = [];
		html.each_between('<a href="/comic/', '</a>', function(text) {
			id_list.push(text.between(null, '"'));
			id_data.push(get_label(text.between('title="', '"')));
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'comic/' + work_id;
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between(
			// <h1 class="comics-detail__title" data-v-6f225890>原來我是修仙大佬</h1>
			'<h1 class="comics-detail__title"', '</h1>').between('>')),
			author : get_label(html.between(
			// <h2 class="comics-detail__author" data-v-6f225890>亂室佳人</h2>
			'<h2 class="comics-detail__author"', '</h2>').between('>')),

			// 選擇性屬性：須配合網站平台更改。
			tags : html.all_between('<span class="tag"', '</span>').map(
					function(tag) {
						return get_label(tag.between('>'));
					}),
			last_update : get_label(html.between('最新：').between('<em', '</em>')
					.between('>').replace(/\((.+) 更新\)/, '$1')),
			latest_chapter : get_label(html.between('最新：', '</a>')),
			description : get_label(html.between('<p class="comics-detail',
					'</p>').between('>')),
			/**
			 * cover image<code>
			<amp-img alt="原來我是修仙大佬" width="180" height="240" layout="responsive" src="https://static-tw.baozimh.com/cover/yuanlaiwoshixiuxiandalao-luanshijiaren.jpg" data-v-6f225890>
			<code>
			 */
			cover_image : html.between('layout="responsive" src="', '"')
		};

		// 由 meta data 取得作品資訊。
		extract_work_data(work_data, html);

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		var _this = this;
		// reset chapter list
		work_data.chapter_list = [];
		html.each_between('<div class="section-title"', null, function(text) {
			/**
			 * <code>
			<div class="section-title" data-v-6f225890>章節目錄</div>
			<code>
			 */
			var part_title = text.between('>', '</div>');
			if (part_title === '最新章節')
				return;
			_this.set_part(work_data, part_title);
			// console.log(text);
			var matched;
			while (matched = PATTERN_chapter_link.exec(text)) {
				var chapter_data = {
					title : get_label(matched[2]),
					// TODO: fix "&amp;"
					url : matched[1].replace(/&amp;/g, '&')
				};
				_this.add_chapter(work_data, chapter_data);
			}
		});

		// console.log(work_data.chapter_list);
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		html = html
		// <div class="chapter-main scroll-mode">
		.between('<div class="chapter-main scroll-mode">');
		// console.trace(html);

		var chapter_data = work_data.chapter_list[chapter_NO - 1];

		var image_list = chapter_data.image_list = [];

		/**
		 * <code>
		<img src="https://s1.baozimh.com/scomic/yuanlaiwoshixiuxiandalao-luanshijiaren/0/0-vmac/1.jpg" alt="原來我是修仙大佬 - 預告 - 1" width="1200" height="3484" data-v-25d25a4e>
		<code>
		 */
		html.each_between('<img src="', '>', function(text) {
			image_list.push({
				title : get_label(text.between('alt="', '"')),
				url : encodeURI(text.between(null, '"'))
			});
		});
		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
