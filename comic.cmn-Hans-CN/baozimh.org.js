/**
 * 批量下載包子漫畫的工具。 Download baozimh comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 2023/6/16: https://baozimh.org/
	base_URL : 'https://baozimh.org/',

	// 最小容許圖案檔案大小 (bytes)。
	// 對於極少出現錯誤的網站，可以設定一個比較小的數值，並且設定.allow_EOI_error=false。因為這類型的網站要不是無法取得檔案，要不就是能夠取得完整的檔案；要取得破損檔案，並且已通過EOI測試的機會比較少。
	// 對於有些圖片只有一條細橫桿的情況。
	MIN_LENGTH : 50,
	// e.g., wonengkandaochenggonglu-namu 我能看到成功率/0199 第199话
	// 霁月之下/wonengkandaochenggonglu-namu-199-135.jpg

	// 2023/6/27 20:3:3 時間間距太短會出現 異常 HTTP 狀態碼 502
	one_by_one : '1s',
	chapter_time_interval : '1s',

	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	skip_error : true,

	// e.g., 原来我是修仙大佬 0092 九十二话 .webp
	acceptable_types : 'webp',

	search_URL : '?s=',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		var id_list = [], id_data = [];
		html.each_between('<h2', '</h2>', function(text) {
			text = text.between('<a href="');
			id_list.push(text.between(null, '"').between('manga/', '/'));
			id_data.push(get_label(text.between('>', '<')));
		});
		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	work_URL : function(work_id) {
		return 'manga/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// console.log(html);
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between(
			// <div class="gb-inside-container"><h1 class="gb-headline
			// gb-headline-60777e5b gb-headline-text">全知读者视角</h1>
			'<h1 class="gb-headline', '</h1>').between('>')),
			author : get_label(html.between(
			// <div class="author-content">作者：<a
			// href="https://baozimh.org/manga-author/singsyong/"
			// rel="tag">SingSyong</a>，<a
			// href="https://baozimh.org/manga-author/sleep-c/"
			// rel="tag">Sleep-C</a></div>
			'<div class="author-content">作者：', '</div>').between('>')),

			// 選擇性屬性：須配合網站平台更改。
			tags : html.all_between('<div class="genres-content">', '</div>')
			// <div class="genres-content">类型：<a
			// href="https://baozimh.org/manga-genre/kr/"
			// rel="tag">韩漫</a></div><div class="genres-content">标签：<a
			// href="https://baozimh.org/manga-tag/qihuan/"
			// rel="tag">奇幻</a></div>
			.map(function(tag) {
				return get_label(tag.between('：') || tag);
			}),
			description : get_label(html.between(
					'<div class="dynamic-entry-content">', '</div>')),
			/**
			 * cover image<code>
			<div class="gb-inside-container"> <img post-id="10384" fifu-featured="1" width="420" height="560" src="https://cover1.baozimh.org/cover/bzcom/quanzhidouzheshijiao/quanzhiduzheshijiao-sleepcsingsyong.webp" class="dynamic-featured-image manga-feature wp-post-image" alt="全知读者视角" title="全知读者视角" title="全知读者视角" decoding="async" />
			<code>
			 */
			cover_image : html.between('<img post-id="', '>').between(' src="',
					'"')
		};

		// 由 meta data 取得作品資訊。
		extract_work_data(work_data, html);

		// console.log(work_data);
		return work_data;
	},
	chapter_list_URL : function(work_id, work_data) {
		return 'chapterlist/' + work_id + '/';
	},
	get_chapter_list : function(work_data, html, get_label) {
		// console.log(html);
		var _this = this;
		// reset chapter list
		work_data.chapter_list = [];
		html = html.between('<ul class="main version-chaps">', '</ul>');
		// <a id="shenchongjinhua-yuewenmanhua_47872a3603753b47872_223"
		// href="https://baozimh.org/manga/shenchongjinhua-yuewenmanhua/47872a3603753b47872_223/"
		// class="wp-manga-chapterlist">213 无尽轮回迷宫 <span
		// class="chapter-release-date"><i>12分钟 ago</i></span> </a>
		html.each_between('<a id="', '</a>', function(text) {
			var chapter_data = {
				title : get_label(text.between('>', '<')),
				date : get_label(text.between(
						'<span class="chapter-release-date">', '</span>')),
				url : text.between(' href="', '"')
			};
			_this.add_chapter(work_data, chapter_data);
		});
		work_data.inverted_order = true;
		// console.log(work_data.chapter_list);
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1];

		var image_list = chapter_data.image_list = [];

		html = html.between('<div class="gb-inside-container">',
				'class="site-footer')
				|| html;
		html = html.replace(/<noscript>[\s\S]+?<\/noscript>/g, '');
		html.each_between('<img', '>', function(text) {
			var url = text.between('data-src="', '"')
					|| text.between('src="', '"');
			image_list.push({
				title : get_label(text.between('title="', '"')),
				url : url
			});
		});
		// console.log(image_list);

		return chapter_data;
	}

});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
