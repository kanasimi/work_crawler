/**
 * 批量下載 咪咕动漫有限公司 咪咕圈圈 漫画的工具。 Download migudm comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var PATTERN_characters = /<span class="authorItem">([\s\S]+?)<span class="authorDesc">([\s\S]+?)<\/span>/;
var PATTERN_chapter_keys = /<input +type="hidden" +(?:class|id)="([a-zA-Z]+)" +value="([^<>"]+)"/g;
var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。
	// recheck : true,

	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// one_by_one : true,
	base_URL : 'http://www.migudm.cn/',

	// 提取出引數（如 URL）中的作品ID 以回傳。
	extract_work_id : function(work_information) {
		if (CeL.is_digits(work_information)) {
			work_information = 'comic_' + work_information;
		}
		// comic_090000004650
		// cartoon_001000005021
		return /^[a-z]+_\d+$/.test(work_information) && work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return 'search/result/list.html?hintKey='
				+ btoa(encodeURIComponent(work_title))
				+ '&hintType=2&pageSize=30&pageNo=1';
	},
	parse_search_result : function(html, get_label) {
		// console.log(html);
		var id_list = [], id_data = [];
		// <div class="classificationList search">...</main>
		// <li class="clItem clearfix comic">
		html.each_between('<li class="clItem', '</li>',
		/**
		 * e.g., <code>
		<a target="_blank" stat='index_search_comic;{"Key_Type":"search_keyword","Key_Word":"全物种进化","Position_ID":"1"}' href="/comic/090000004650.html"  title="全物种进化">
		<img src="http://rsdown.migudm.cn/SFile/public/noprot/2019/1/2/1001865302_J8UGeo/1001865302_J8UGeo_verSmall1_210_280.jpg" alt="全物种进化">
		</code>
		 */
		function(text) {
			// console.log(text);
			var matched = text.match(
			//
			/<a [\s\S]*?href="\/([a-z]+\/\d+)\.html" +title="([^<>"]+)">/);
			id_list.push(matched[1].replace('/', '_'));
			id_data.push(get_label(matched[2]));
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		// console.log(work_id);
		return work_id.replace('_', '/') + '.html';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// console.log(html);

		// <div class="ctDetialBrief clearfix comic">
		// <div class="ctDetialBriefLeft clearfix">
		// <div class="inner">
		// ...
		// <div class="detailBox">
		var text = html.between('class="ctDetialBrief',
		// <div class="mainBody wrapper clearfix">
		'class="mainBody');
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(text.between('<h1 class="title">',
			// <span class="right">
			'<')),
			author : get_label(text.between('<p class="author">', '</p>')
					.replace('<span class="lineTit">作者</span>', '')),

			/**
			 * e.g., <code>
			<span class="clickCountStr">
			<a class="status" target="_blank" href="/comic/update/">连载中</a>
			</span><span class="date">
			2019-01-21
			</span>
			<span class="num">更新至119话</span>
			<span class="week"> [每周五更新一集，我们相约吧！] </span>
			</div>
			</code>
			 */
			status : get_label(text.between('class="status"', '<')
			//
			.between('>')),
			last_update : get_label(text.between('class="date">', '<')),
			latest_chapter : get_label(text.between('class="num">', '<')),
			update_frequency : get_label(text.between('class="week">', '<')),

			// 選擇性屬性：須配合網站平台更改。
			clickCountStr : get_label(text.between(
			// <span class="clickCountStr"><i
			// class="fireLg"></i><em>4,836万</em></span>
			'class="clickCountStr"', '</').between('>')),
			tags : [],
			description : get_label(text.between(
			// <div class="desc" id="worksDescBox">
			// <span class="worksJJ">简介</span><p id="worksDesc">
			'<p id="worksDesc">', '</p>')),
			image : text.between('<div class="inner">', '</div>').between(
			// <img class="" src="...
			'<img ', '>').between('src="', '"'),
			characters : Object.create(null)
		};

		Array.from(text.matchAll(/>([^<>]+)<\/a>/)).forEach(function(matched) {
			// delete matched.input;
			// console.log(matched);
			matched = get_label(matched[1]);
			if (matched) {
				work_data.tags.push(matched);
			}
		});

		Array.from(
				text.between('<span class="lineTit">').matchAll(
						PATTERN_characters)).forEach(function(matched) {
			work_data.characters[get_label(matched[1])]
			//
			= get_label(matched[2]);
		});

		extract_work_data(work_data, html);

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		/**
		 * 取正序 e.g., <code>
		<div class="ctSectionListBd" id="ctSectionListBd" style="display: none;">
		 <div class="numberList clearfix">
		</code>
		 */
		html = html.between('id="ctSectionListBd"', 'id="negCtSectionListBd"');

		// reset work_data.chapter_list
		work_data.chapter_list = [];

		/**
		 * e.g., <code>
		<a stat='detail_comic_contentLabel;{"Position_ID":"6","Key_Word":"090000004650","Key_Type":"comic_part"}' href="/090000004650/chapter/1.html" class="item ellipsis" title="全物种进化 第1话" data-opusname="全物种进化" data-index="1" data-url="/090000004650/chapter/1.html" target="_blank">
		 1.第1话
		</a>
		</code>
		 */
		var link, PATTERN = /<a ([\s\S]+?)>/g;
		while (link = PATTERN.exec(html)) {
			link = link[1];
			var chapter_data = {
				title : get_label(link.between(' title="', '"')),
				url : link.between(' href="', '"')
			}, matched = link.match(/stat='([^']+?)'/);

			if (matched) {
				// add additional information
				matched = matched[1].between('{');
				try {
					Object.assign(chapter_data, JSON.parse('{' + matched));
				} catch (e) {
					// TODO: handle exception
				}
			}

			work_data.chapter_list.push(chapter_data);
		}

		// console.log(work_data);
	},

	pre_parse_chapter_data
	// 執行在解析章節資料 process_chapter_data() 之前的作業 (async)。
	// 必須自行保證執行 callback()，不丟出異常、中斷。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		// console.log(XMLHttp);
		// console.log(work_data);

		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		var html = XMLHttp.responseText, matched;
		// console.log(html);

		while (matched = PATTERN_chapter_keys.exec(html)) {
			chapter_data[matched[1]] = matched[2];
		}

		// console.log(chapter_data);

		/**
		 * e.g., <code>
		<input type="hidden" id="playUrl" value="hwOpusId=090000004650&hwItemId=091000017549&index=119&opusType=2">

		// http://www.migudm.cn/assets/build/main/index.min.js?v=1.1.15
		s = $(".basePath").val();

		s + "opus/webQueryWatchOpusInfo.html?" + $("#playUrl").val()
		</code>
		 */
		this.get_URL(chapter_data.basePath + "opus/webQueryWatchOpusInfo.html?"
				+ chapter_data.playUrl, callback);
	},
	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(JSON.parse(html));
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		Object.assign(chapter_data, JSON.parse(html).data);
		Object.assign(chapter_data, {
			title : chapter_data.info.itemName || chapter_data.title,
			limited : chapter_data.info.isFee
					&& chapter_data.info.isFee !== '0'
		});
		// console.log(chapter_data);
		chapter_data.image_list = chapter_data.jpgList
				|| chapter_data.watchUrlListWebp;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
