/**
 * 批量下載 Oh漫画 的工具。 Download ohmanhua comics.
 * 
 * @see http://www.z1i.cn/ https://www.007ts.co/
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。
	// recheck : true,
	// 當無法取得chapter資料時，直接嘗試下一章節。在手動+監視下recheck時可併用此項。
	// skip_chapter_data_error : true,

	// 本站常常無法取得圖片，因此得多重新檢查。
	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// {Natural}MIN_LENGTH:最小容許圖案檔案大小 (bytes)。
	MIN_LENGTH : 350,

	// one_by_one : true,

	// 2019/9/27-2020/4/27: ONE漫画 https://www.onemanhua.com/
	// 2020/5/2: Oh漫画 https://www.ohmanhua.com/
	base_URL : 'https://www.ohmanhua.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search?searchString=',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		html = html.between('fed-list-head', 'fed-main-right');
		// console.log(html);
		var id_list = [], id_data = [];
		html.each_between('<dl', '</dl>', function(token) {
			var matched = token.between('<h1', '</h1>').match(
					/<a [^<>]*?href="\/(\d+)\/"[^<>]*?>(.+?)<\/a>/);
			if (matched) {
				id_list.push(+matched[1]);
				id_data.push(matched[2]);
			}
		});

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var text = html.between('fed-main-info', 'fed-tabs-info');
		// "fed-data-info"?
		text = text.between('fed-deta-info') || text;
		// console.log(text);

		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(text.between('<h1', '</h1>').between('>')),

		// 選擇性屬性：須配合網站平台更改。
		};

		extract_work_data(work_data, html);
		// console.log(work_data);

		// --------------------------------------

		// console.log(text.between('fed-part-rows', '</ul>'));
		text.between('fed-part-rows', '</ul>')
		// <li class="fed-col-xs12 fed-col-md6 fed-part-eone
		// website-padding-right-1">
		.each_between('<li', '</li>', function(token) {
			var matched = token.match(
			// <span class="fed-text-muted">状态</span>
			/fed-text-muted[^<>]+>([^<>]+)<\/span>([\s\S]+)/);
			if (matched) {
				// delete matched.input;
				// console.log(matched);
				work_data[get_label(matched[1])] = get_label(matched[2]);
			}
		});

		// --------------------------------------

		var matched = text.between('fed-deta-images', '</dt>').match(
				/<a [^<>]*?data-original="[^<>"]+"/);
		if (matched) {
			work_data.image = matched[1];
		}

		if (!work_data.last_update && work_data.更新) {
			work_data.last_update = work_data.更新;
		}

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html) {
		var chapter_list = [], data = html.between(
				'fed-play-item fed-drop-item fed-visible')
		// <div class="all_data_list">
		.between('all_data_list', '</div>');

		// <li class="fed-padding fed-col-xs6 fed-col-md3 fed-col-lg3"><a
		// class="fed-btns-info fed-rims-info fed-part-eone" title="第846话
		// 亡魂山（下）" href="/10101/1/852.html">第846话 亡魂山（下） </a></li>
		data.each_between('<li ', '</li>', function(token) {
			var matched = token.match(
			//
			/<a [^<>]*?title="([^<>"]+?)"[^<>]*? href="([^<>"]+?)"/);
			var chapter_data = {
				title : matched[1],
				url : matched[2]
			};
			chapter_list.push(chapter_data);
		});
		work_data.chapter_list = chapter_list.reverse();
		// console.log(work_data.chapter_list);
	},

	using_webp : false,
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// 2019/9/27: "JRUIFMVJDIWE569j"
		var __READKEY = "JRUIFMVJDIWE569j";
		function decode(C_DATA) {
			C_DATA = crawler.__cdecrypt(__READKEY,
			// @see https://www.ohmanhua.com/js/custom.js
			CryptoJS.enc.Base64.parse(C_DATA).toString(CryptoJS.enc.Utf8));

			var mh_info, image_info;
			eval(C_DATA);
			mh_info.image_info = image_info;
			return mh_info;
		}

		var chapter_data = html.between("var C_DATA='", "'");
		if (!chapter_data || !(chapter_data = decode(chapter_data))) {
			CeL.warn(work_data.title + ' #' + chapter_NO
					+ ': No valid chapter data got!');
			return;
		}
		// console.log(chapter_data);

		// chapter_data.startimg often "1"
		var image_NO = parseInt(chapter_data.startimg) || 1;
		// 設定必要的屬性。
		chapter_data.title = chapter_data.pagename;
		// chapter_data.image_count = chapter_data.totalimg + image_NO - 1;

		// @see function __cr_getpice() @
		// https://www.ohmanhua.com/js/manga.read.js
		var chapter_image_base_path = this.base_URL.replace(/:\/\/.+/, '://')
		// "img.mljzmm.com"
		+ chapter_data.domain + "/comic/" + encodeURI(chapter_data.imgpath);
		chapter_data.image_list = [];
		for (; image_NO <= chapter_data.totalimg; image_NO++) {
			// @see __cr.PrefixInteger()
			var image_url = chapter_image_base_path + image_NO.pad(4) + ".jpg";
			if (this.using_webp) {
				// @see __cr.switchWebp()
				image_url += '.webp';
			}
			chapter_data.image_list.push(image_url);
		}

		// console.log(chapter_data);
		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

setup_crawler(crawler, typeof module === 'object' && module);

// 創建 main directory。
CeL.create_directory(crawler.main_directory);

// https://www.ohmanhua.com/js/l.js 事實上是 CryptoJS
var decode_filename = 'l.js';

CeL.get_URL_cache(crawler.base_URL + 'js/' + decode_filename,
		after_fetch_decode_file, crawler.main_directory + decode_filename);

function after_fetch_decode_file(contents, error) {
	contents = contents.replace(/==typeof exports/g, '==typeof exports_')
			.replace(/\}\(this,/g, '}(globalThis,').replace(
					'function __cdecrypt',
					'crawler.__cdecrypt=function __cdecrypt');
	eval(contents);

	start_crawler(crawler, typeof module === 'object' && module);
}
