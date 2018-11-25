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

	preserve_chapter_page : false,
	// 提取出引數（如 URL）中的作品ID 以回傳。
	extract_work_id : function(work_information) {
		// /^manhua-[a-z\-\d]+$/;
		// e.g., http://www.dm5.com/manhua-1122/
		// http://www.dm5.com/manhua--c-94-okazu/
		return /^[a-z\-\d]+$/.test(work_information) && work_information;
	},

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
	parse_work_data : function(html, get_label, extract_work_data) {
		var part_list = [], matched,
		//
		text = html.between('<div class="detail-list-title">', '</div>'),
		//
		PATTERN = /['"]detail-list-select-(\d)['"][^<>]+>([^<>]+)/g;
		while (matched = PATTERN.exec(text)) {
			part_list[matched[1]] = get_label(matched[2]);
		}

		matched = text.between('最新').match(/<a [^<>]*?title="([^<>"]+)"/);

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
			score : html.between('<span class="score">', '</span>'),
			part_list : part_list
		};

		if (matched) {
			work_data.latest_chapter = matched[1];
		}

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
	get_chapter_list : function(work_data, html, get_label) {
		// 1: 由舊至新
		work_data.inverted_order = / DM5_COMIC_SORT\s*=\s*2/.test(html);

		html = html.between('detail-list-select', '<div class="index-title">');

		// reset chapter_list
		work_data.chapter_list = [];
		var PATTERN_chapter = /<li>([\s\S]+?)<\/li>|<ul ([^<>]+)>/g, matched;
		while (matched = PATTERN_chapter.exec(html)) {
			if (matched[2]) {
				// <ul class="view-detail-list detail-list-select"
				// id="detail-list-select-1">
				matched[2] = matched[2].match(/ id="detail-list-select-(\d)"/);
				if (matched[2]
						&& (matched[2] = work_data.part_list[matched[2][1]])) {
					this.set_part(work_data, matched[2]);
				} else if (!matched[0].includes(' class="chapteritem">')) {
					CeL.error('get_chapter_list: Invalid NO: ' + matched[0]);
				}
				continue;
			}

			matched = matched[1];
			var chapter_data = {
				title : get_label(matched.between(' class="title', '</p>')
						.between('>'))
						// e.g., 古惑仔
						|| get_label(matched
						// for 七原罪 第168话 <十戒>歼灭计划
						.replace(/ title="[^"]+"/, '')).replace(/\s+/g, ' '),

				url : matched.between(' href="', '"')
			};
			matched = get_label(matched.between('<p class="tip">', '</p>'));
			if (matched) {
				chapter_data[Date.parse(matched) ? 'date' : 'tip'] = matched;
			}
			this.add_chapter(work_data, chapter_data);
		}
	},

	pre_parse_chapter_data
	// 執行在解析章節資料 process_chapter_data() 之前的作業 (async)。必須自行保證不丟出異常。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		if (!work_data.image_list) {
			// image_list[chapter_NO] = [url, url, ...]
			work_data.image_list = [];
		}

		// 參照下方原理說明，沒有辦法使用 cache。
		if (false && !this.recheck
				&& Array.isArray(work_data.image_list[chapter_NO])) {
			callback();
			return;
		}

		var html = XMLHttp.responseText,
		//
		text = html.between('var isVip', '</script>'),
		//
		DM5 = work_data.DM5 = CeL.null_Object(), matched,
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
		if (!(DM5.IMAGE_COUNT > 0)) {
			if (html.includes('<p class="subtitle">此章节为付费章节</p>')) {
				CeL.info(work_data.title + ': 第' + chapter_NO + '章為需要付費的章節');
			}
			callback();
			return;
		}

		// e.g., 某科学的超电磁炮
		matched = html.match(
		// <input type="hidden" id="dm5_key" value="" />
		/ id="dm5_key"[\s\S]{1,50}?<script[^<>]*>\s*eval([\s\S]+?)<\/script>/);
		if (matched) {
			text = eval(matched[1]).replace(
			// 有時var123會以數字開頭，屬於網站bug。 e.g., 风云全集
			/\$\("#dm5_key"\)\.val\(([a-z_\d]*)\)/, 'DM5.mkey=_$1')
			// e.g., "var 161dfgdfg=''+" ... ";$("#dm5_key").val(161dfgdfg);"
			.replace(/var ([a-z_\d]*)/g, 'var _$1');
			eval(text);
		}

		// @see ShowNext() , ajaxloadimage() @
		// http://css122us.cdndm5.com/v201801302028/dm5/js/chapternew_v22.js
		// e.g.,
		// http://www.dm5.com/m521971/chapterfun.ashx?cid=521971&page=6&key=&language=1&gtk=6&_cid=521971&_mid=33991&_dt=2018-02-06+12%3A12%3A25&_sign=a50d71d1c768e731d2e8dcaeae12feb3
		var parameters = {
			cid : DM5.CID,
			// page : DM5.PAGE,
			page : 1,
			key : DM5.mkey || '',
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

		var chapter_data = work_data.chapter_list[chapter_NO - 1];

		// 這段程式碼模仿 work_crawler 模組的行為。
		// @see process_images(chapter_data, XMLHttp) @
		// CeL.application.net.work_crawler
		CeL.log(chapter_NO + '/' + work_data.chapter_list.length + ' ['
				+ this.get_chapter_directory_name(work_data, chapter_NO) + '] '
				+ DM5.IMAGE_COUNT + ' images.');

		function image_file_path_of(image_NO) {
			// @see get_data() @ CeL.application.net.work_crawler
			var chapter_label = _this.get_chapter_directory_name(work_data,
					chapter_NO);
			var chapter_directory = work_data.directory + chapter_label
					+ CeL.env.path_separator;

			CeL.create_directory(chapter_directory);

			// 這段程式碼模仿 work_crawler 模組的行為。
			// @see image_data.file @ CeL.application.net.work_crawler
			return chapter_directory + work_data.id + '-' + chapter_NO + '_'
					+ image_NO.pad(3) + '.' + _this.default_image_extension;
		}

		// --------------------------------------

		// 這個網站似乎每個章節在呼叫 chapterfun.ashx 之後才能下載圖片。
		// 並且當呼叫另一次 chapterfun.ashx 之後就不能下載上一次的圖片了。
		// 由於圖片不能並行下載，下載速度較慢。
		// 但是可以多開幾支程式，每一支下載一個作品。

		CeL.run_serial(function(run_next, image_NO) {
			if (CeL.read_file(image_file_path_of(image_NO))) {
				run_next();
				return;
			}
			process.stdout.write('圖 ' + image_NO + '/' + DM5.IMAGE_COUNT
					+ '...\r');

			get_token(image_NO, run_next);
			return;

			// Skip codes below: 可以不用取得 history.ashx。
			history_parameters.page = image_NO;
			CeL.get_URL(_this.full_URL(_this.chapter_URL(work_data, chapter_NO)
					+ 'history.ashx'), function(XMLHttp) {

				get_token(image_NO, run_next);

			}, null, history_parameters, Object.assign({
				error_retry : _this.MAX_ERROR_RETRY,
				no_warning : true
			}, _this.get_URL_options));

		}, DM5.IMAGE_COUNT, 1, function() {
			// .unique() 應該會過得相同的結果
			// this_image_list = this_image_list.unique();

			work_data.image_list[chapter_NO] = this_image_list;
			// _this.save_work_data(work_data);
			// console.log(this_image_list);

			callback();
		});

		// --------------------------------------

		// 從 dm5 網站獲得 token 通行碼
		function get_token(image_NO, run_next) {
			parameters.page = image_NO;
			// CeL.set_debug(6);
			// console.log(CeL.get_URL.parameters_to_String(parameters));
			CeL.get_URL(_this.full_URL(_this.chapter_URL(work_data, chapter_NO)
					+ 'chapterfun.ashx'), function(XMLHttp) {
				var html = XMLHttp.responseText;
				// console.log(html);
				if (html === '错误的请求') {
					var warning = work_data.title + ' #' + chapter_NO + '-'
							+ image_NO + ': ' + html;
					_this.onerror(warning, work_data);
					CeL.warn(warning);
					run_next();
					return;
				}
				try {
					// https://github.com/kanasimi/work_crawler/issues/81
					html = eval(html.replace(/^eval/, ''));
				} catch (e) {
					var message = work_data.title + ' #' + chapter_NO + '-'
							+ image_NO + ': 無法從 dm5 網站獲得 token: ' + e;
					CeL.error(message);
					_this.onwarning(message, work_data);
					console.trace(e);
					// console.log(html);
					run_next();
					return;
				}
				// console.log(html);
				var image_list = eval(html);
				if (false) {
					console.log(work_data.title + ' #' + chapter_NO + '-'
							+ image_NO + ':');
					console.log(image_list);
				}
				// image_list = [ 本圖url, 下一張圖url ]
				image_list.forEach(function(url, index) {
					var previous_url
					//
					= this_image_list[index += image_NO - 1];
					if (previous_url && previous_url !== url) {
						var warning = work_data.title + ' #' + chapter_NO + '-'
								+ image_NO + ': url:\n	  ' + previous_url
								+ '	→' + url;
						_this.onerror(warning, work_data);
					}
					this_image_list[index] = url;
				});
				get_image_file(image_NO, image_list, run_next);

			}, null, parameters, Object.assign({
				error_retry : _this.MAX_ERROR_RETRY
			}, _this.get_URL_options));
		}

		// --------------------------------------

		function get_image_file(image_NO, image_list, run_next) {
			CeL.get_URL_cache(encodeURI(image_list[0]), function() {
				run_next();
			}, {
				file_name : image_file_path_of(image_NO),
				no_write_info : true,
				encoding : undefined,
				charset : _this.charset,
				get_URL_options : Object.assign({
					error_retry : _this.MAX_ERROR_RETRY
				}, _this.get_URL_options)
			});
		}

	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		return {
			// 圖片已經先在前面 get_image_file() 下載完了。
			images_downloaded : true
		};

		// console.log(work_data.image_list[chapter_NO]);
		var chapter_data = {
			image_list : work_data.image_list[chapter_NO].map(function(url) {
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
