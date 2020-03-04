/**
 * 批量下載 大古漫画网 的工具。 Download dagu comics.
 * 
 * 2018/10/19–11/24 間，[9妹漫画网](http://www.9mdm.com/)改名大古漫画网。<br />
 * 2019/11/28–12/5 間，大古漫画网 改版，採用晴天漫画程序。
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.qTcms2017');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2017({
	// 圖像檔案下載失敗處理方式：忽略/跳過圖像錯誤。當404圖像不存在、檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。default:false
	skip_error : true,

	// charset : '',

	// {Natural}最小容許圖案檔案大小 (bytes)。
	MIN_LENGTH : 500,

	base_URL : 'https://www.dagumanhua.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return [ 'e/search/index.php', {
			show : 'title,writer',
			tempid : 1,
			tbname : 'sinfo',
			keyboard : work_title
		} ];
	},
	using_web_search : true,

	pre_parse_chapter_data
	// 執行在解析章節資料 process_chapter_data() 之前的作業 (async)。
	// 必須自行保證執行 callback()，不丟出異常、中斷。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		//
		url = this.full_URL(chapter_data.url), html = XMLHttp.responseText,
		//
		image_count = html.between('totalpage =', ';').trim(), _this = this;

		if (image_count === '[!--diypagenum--]') {
			// displayed page number?
			// console.log(html);

			// e.g., http://www.9mdm.com/manhua/4353/141236.html
			// https://www.dagumanhua.com/manhua/10008/317688.html
			image_count = XMLHttp.responseText.between('<div class="mh_list">',
					'</div>').match(/ src="[^"]+"/g);
			// https://www.dagumanhua.com/manhua/4520/129933.html
			image_count = image_count ? image_count.length : 0;
		} else {
			image_count = +image_count;
		}

		if (!(image_count >= 0)) {
			throw work_data.title + ' #' + chapter_NO + ' '
					+ chapter_data.title + ': Can not get image count!';
		}

		// 將過去的 chapter_data.image_list cache 於 work_data.image_list。
		if (work_data.image_list) {
			chapter_data.image_list = work_data.image_list[chapter_NO - 1];
			if (!this.reget_image_page && chapter_data.image_list
					&& chapter_data.image_list.length === image_count) {
				CeL.debug(work_data.title + ' #' + chapter_NO + ' '
						+ chapter_data.title + ': Already got ' + image_count
						+ ' images.');
				chapter_data.image_list = chapter_data.image_list
				// .slice() 重建以節省記憶體用量。
				.slice().map(function(image_data) {
					// 僅保留網址資訊，節省記憶體用量。
					return typeof image_data === 'string' ? image_data
					// else assert: CeL.is_Object(image_data)
					: image_data.url;
				});
				callback();
				return;
			}
		} else {
			work_data.image_list = [];
		}

		function extract_image(XMLHttp) {
			XMLHttp.responseText.between('<div class="mh_list">', '</div>')
			// .each_between(): for
			// https://www.dagumanhua.com/manhua/10008/317688.html
			.each_between(' src="', '"', function(url) {
				// .trim(): for 遮天 第92话 各打算盘
				url = encodeURI(url.trim());
				CeL.debug('Add image ' + chapter_data.image_list.length
				//
				+ '/' + image_count + ': ' + url, 1, 'extract_image');
				// 僅保留網址資訊，節省記憶體用量。
				chapter_data.image_list.push({
					get_URL_options : {
						headers : {
							// img.baidu.com.manhuapi.com 不可設定 Referer。
							Referer : ''
						}
					},
					// e.g.,
					// http://img.baidu.com.manhuapi.com/c/20180926/urgglxb2nz3.jpg
					url : url
				});
			});
		}

		chapter_data.image_list = [];
		extract_image(XMLHttp);

		CeL.run_serial(function(run_next, image_NO, index) {
			var image_page_url = url.replace(/(\.[^.]+)$/, '_' + image_NO
					+ '$1');
			if (false) {
				console.log('Get #' + index + '/' + image_count + ': '
						+ image_page_url);
			}
			process.stdout.write('Get image data page of §' + chapter_NO + ': '
					+ image_NO + '/' + image_count + '...\r');
			_this.get_URL(image_page_url, function(XMLHttp) {
				extract_image(XMLHttp);
				run_next();
			}, null, true);
		}, image_count, 2, function() {
			work_data.image_list[chapter_NO - 1] = chapter_data.image_list
			// .slice() 重建以節省記憶體用量。
			.slice();
			callback();
		});
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		// console.log(chapter_data);

		// 已在 pre_parse_chapter_data() 設定完 {Array}chapter_data.image_list
		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
