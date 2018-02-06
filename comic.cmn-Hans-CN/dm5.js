/**
 * 批量下載动漫屋网/漫画人的工具。 Download dm5.com comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。
	// recheck : true,
	// 當無法取得chapter資料時，直接嘗試下一章節。在手動+監視下recheck時可併用此項。
	// skip_chapter_data_error : true,

	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	one_by_one : true,
	base_URL : 'http://www.dm5.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		// @see 搜索框文本改变 function SearchInputChange() @
		// http://css122us.cdndm5.com/v201801302028/dm5/js/search.js
		return [ 'search.ashx?d=' + new Date().getTime(), {
			t : work_title,
			language : 1
		} ];
	},
	parse_search_result : function(html, get_label) {
		var id_list = [], id_data = [];
		html.each_between('<li onclick="window.location.href=', '</li>',
		/**
		 * e.g., <code>
		<li onclick="window.location.href='/manhua-shanhainizhan1/';" style="cursor: pointer;"><a href="javascript:void(0);" class="type_1" style="display: block;"><span class="left"><span class="red">山海逆战</span></span><span class="right">第184回</span></a></li>
		</code>
		 */
		function(text) {
			id_list.push(text.between("'/", "/'"));
			id_data.push(get_label(text.between('<span class="left">',
					'<span class="right">')));
		});
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	parse_work_data : function(html, get_label, exact_work_data) {
		html = html.between('<div class="banner_detail_form">',
				'<div class="bottom"');

		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<p class="title">',
					'<span class="right">')),

			// 選擇性屬性：須配合網站平台更改。
			author : get_label(html.between('<p class="subtitle">', '</p>')
					.replace(/^.*?[:：]/, '')),
			description : get_label(html.between('<p class="content"', '</p>')
					.between('>').replace(/<a href="#[^<>]+>.+?<\/a>/g, '')),
			image : html.between('<img src="', '"'),
			score : html.between('<span class="score">', '</span>')
		};

		html.between('<p class="tip">', '<p class="content"').split(
				'<span class="block">').forEach(function(text) {
			var matched = text.match(/^([^<>:：]+)([\s\S]+)$/);
			if (matched && (matched[2] = get_label(matched[2])
			//
			.replace(/^[\s:：]+/, '').trim().replace(/\s+/g, ' '))) {
				work_data[matched[1]] = matched[2];
			}
		});

		work_data.status = work_data.状态;

		return work_data;
	},
	get_chapter_count : function(work_data, html, get_label) {
		// <ul class="view-detail-list detail-list-select"
		// id="detail-list-select-1">
		html = html.between('detail-list-select', '</ul>');

		work_data.chapter_list = [];
		html.each_between('<li>', '</li>',
		//
		function(text) {
			var chapter_data = {
				title : get_label(text.between(' class="title', '</p>')
						.between('>'))
						// e.g., 古惑仔
						|| get_label(text).replace(/\s+/g, ' '),

				url : text.between(' href="', '"')
			};
			text = get_label(text.between('<p class="tip">', '</p>'));
			if (text) {
				chapter_data[Date.parse(text) ? 'date' : 'tip'] = text;
			}
			work_data.chapter_list.push(chapter_data);
		});

		return;
	},

	work_URL : function(work_id) {
		return work_id + '/';
	},
	// 執行在解析章節資料process_chapter_data()之前的作業(async)。
	pre_parse_chapter_data : function(XMLHttp, work_data, callback, chapter) {
		if (!work_data.image_list) {
			// image_list[chapter] = [url, url, ...]
			work_data.image_list = [];
		}

		// 沒 cache 的話，每一次都要重新取得每個圖片的頁面，速度比較慢。
		if (false && !this.recheck
				&& Array.isArray(work_data.image_list[chapter])) {
			callback();
			return;
		}

		var html = XMLHttp.responseText;

		var text = html.between('var isVip', '</script>'), DM5 = {}, matched,
		//
		PATTERN_data =
		//
		/\sDM5_([a-zA-Z\d_]+)\s*=\s*(\d+|(["'])(?:\\.|[^\\"']+)*\3)/g;
		// console.log(text);
		while (matched = PATTERN_data.exec(text)) {
			// console.log(matched);
			DM5[matched[1]] = JSON.parse(matched[3] === "'" ? matched[2]
					.replace(/^'|'$/g, '"') : matched[2]);
		}
		// console.log(DM5);

		// @see ShowNext() , ajaxloadimage() @
		// http://css122us.cdndm5.com/v201801302028/dm5/js/chapternew_v22.js
		// e.g.,
		// http://www.dm5.com/m521971/chapterfun.ashx?cid=521971&page=6&key=&language=1&gtk=6&_cid=521971&_mid=33991&_dt=2018-02-06+12%3A12%3A25&_sign=a50d71d1c768e731d2e8dcaeae12feb3
		var parameters = {
			cid : DM5.CID,
			// page : DM5.PAGE,
			page : 1,
			// <input type="hidden" id="dm5_key" value="" />
			key : '',
			language : 1,
			gtk : 6,
			_cid : DM5.CID,
			_mid : DM5.MID,
			_dt : DM5.VIEWSIGN_DT,
			_sign : DM5.VIEWSIGN
		}, history_parameters = {
			cid : DM5.CID,
			mid : DM5.MID,
			page : 1,
			uid : 0,
			language : 1
		};

		var _this = this, this_image_list = [];

		// --------------------------------------

		var chapter_data = work_data.chapter_list[chapter - 1];
		function image_file_path_of(index) {
			var chapter_label = chapter_data.title;
			// 檔名 NO 的基本長度（不足補零）
			chapter_label = chapter.pad(4) + (chapter_label ? ' '
			//
			+ CeL.to_file_name(
			//
			CeL.HTML_to_Unicode(chapter_label)) : '');
			var chapter_directory = work_data.directory + chapter_label
			// 若是以 "." 結尾，在 Windows 7 中會出現問題，無法移動或刪除。
			.replace(/\.$/, '._') + CeL.env.path_separator;

			CeL.create_directory(chapter_directory);

			return chapter_directory + work_data.id + '-' + chapter + '_'
					+ index.pad(3) + '.jpg';
		}

		// --------------------------------------

		CeL.run_serial(function(run_next, index) {
			if (CeL.read_file(image_file_path_of(index))) {
				run_next();
				return;
			}
			process.stdout.write((DM5.IMAGE_COUNT - index) + ' left...\r');

			get_token(index, run_next);
			return;

			history_parameters.page = index;
			CeL.get_URL(_this.base_URL + _this.chapter_URL(work_data, chapter)
					+ 'history.ashx',
			//
			function(XMLHttp) {

				get_token(index, run_next);

			}, null, history_parameters, Object.assign({
				error_retry : 0,
				no_warning : true
			}, _this.get_URL_options));

		}, DM5.IMAGE_COUNT, 1, function() {
			this_image_list = this_image_list.unique();
			work_data.image_list[chapter] = this_image_list;
			// _this.save_work_data(work_data);
			// console.log(this_image_list);
			callback();
		});

		// --------------------------------------

		function get_token(index, run_next) {
			parameters.page = index;
			// CeL.set_debug(9);
			// console.log(CeL.get_URL.parameters_to_String(parameters));
			CeL.get_URL(_this.base_URL + _this.chapter_URL(work_data, chapter)
					+ 'chapterfun.ashx',
			//
			function(XMLHttp) {
				var html = XMLHttp.responseText;
				// console.log(html);
				html = eval(html.replace(/^eval/, ''));
				// console.log(html);
				var image_list = eval(html);
				// console.log(image_list);
				this_image_list.append(image_list);
				get_image_file(index, image_list, run_next);

			}, null, parameters, _this.get_URL_options);
		}

		// --------------------------------------

		function get_image_file(index, image_list, run_next) {
			CeL.get_URL_cache(image_list[0], function() {
				setTimeout(function() {
					run_next();
				}, 1000);
			}, {
				file_name : image_file_path_of(index),
				encoding : undefined,
				charset : _this.charset,
				get_URL_options : _this.get_URL_options
			});

		}
	},

	parse_chapter_data : function(html, work_data, get_label, chapter) {
		// console.log(work_data.image_list[chapter]);
		var chapter_data = {
			image_list : work_data.image_list[chapter].map(function(url) {
				return {
					url : encodeURI(CeL.HTML_to_Unicode(url))
				}
			})
		};

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

// for <b>漫画</b> 已被列为限制漫画，其中有部份章节可能含有暴力、血腥、色情或不当的语言等内容，不适合未成年观众，为保护未成年人，我们将对
// <b>漫画</b> 进行屏蔽。如果你法定年龄已超过18岁。 请点击此处继续阅读！
crawler.get_URL_options.cookie = 'isAdult=1';
start_crawler(crawler, typeof module === 'object' && module);
