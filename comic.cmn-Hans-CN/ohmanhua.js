/**
 * 批量下載 Oh漫画 的工具。 Download ohmanhua comics.
 * 
 * @see 集云数据 https://www.acloudmerge.com/
 * @see http://www.z1i.cn/ https://www.007ts.co/
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// e.g.,
	// 10560 春秋战雄\0203 第206回 神兵异宝
	// 12436 最后的召唤师\云播放 0175 第29话3 再见，朵拉\12436-175-012 bad.jpg
	skip_error : true,

	// {Natural}MIN_LENGTH:最小容許圖案檔案大小 (bytes)。
	MIN_LENGTH : 350,

	// one_by_one : true,

	recheck : 'multi_parts_changed',

	// 2019/9/27-2020/4/27: ONE漫画 https://www.onemanhua.com/
	// 2020/5/2-2020/12/13: Oh漫画 https://www.ohmanhua.com/
	// 2021/1/5: COCOMANHUA COCO漫画 https://www.cocomanhua.com/
	base_URL : 'https://www.cocomanhua.com/',

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
	get_chapter_list : function(work_data, html, get_label) {
		var _this = this, part_list = html.all_between(
		/**
		 * <code>
		<ul class="fed-part-rows"> <li class="fed-drop-btns fed-padding fed-col-xs3 fed-col-md2"><a class="fed-btns-info fed-rims-info fed-part-eone fed-back-green" lineId="1" href="javascript:;">稳定路线</a> </li> <li class="fed-drop-btns fed-padding fed-col-xs3 fed-col-md2"><a class="fed-btns-info fed-rims-info fed-part-eone " lineId="2" href="javascript:;">云播放</a> </li> </ul>
		</code>
		 */
		'<li class="fed-drop-btns fed-padding fed-col-xs3 fed-col-md2">',
		//
		'</li>').map(get_label);
		// console.log(part_list);

		// reset work_data.chapter_list
		work_data.chapter_list = [];

		html.each_between('<div class="fed-play-item fed-drop-item fed-', null,
		/**
		 * <code>
		<div class="fed-play-item fed-drop-item fed-visible"> <ul class="fed-drop-head fed-padding fed-part-rows">...</ul> <div class="all_data_list"> <ul class="fed-part-rows">...</ul> </div>
		<div class="fed-play-item fed-drop-item fed-hidden"> <ul class="fed-drop-head fed-padding fed-part-rows"> ...</ul> <div class="all_data_list"> <ul class="fed-part-rows">...</ul> </div>
		</code>
		 */
		function(text) {
			_this.set_part(work_data, part_list.shift());
			text = text.between('<div class="all_data_list">', '</div>');
			/**
			 * <code>
			<li class="fed-padding fed-col-xs6 fed-col-md3 fed-col-lg3"><a class="fed-btns-info fed-rims-info fed-part-eone" title="第846话 亡魂山（下）" href="/10101/1/852.html">第846话 亡魂山（下） </a></li>
			</code>
			 */
			text.each_between('<li ', '</li>', function(token) {
				var matched = token.match(
				//
				/<a [^<>]*?title="([^<>"]+?)"[^<>]*? href="([^<>"]+?)"/);
				var chapter_data = {
					title : matched[1],
					url : matched[2]
				};
				_this.add_chapter(work_data, chapter_data);
			});
		});

		work_data.inverted_order = true;
		// console.log(work_data.chapter_list);
	},

	using_webp : false,
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		function decode_base64(data) {
			return CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8);
		}

		// 2019/9/27: "JRUIFMVJDIWE569j"
		// 2020/8/21 14:39:33: "fw12558899ertyui"
		// 2021/1/8: var __READKEY = 'fw122587mkertyui';
		var default_READKEY_list = [ 'fw122587mkertyui', 'fw12558899ertyui',
				'JRUIFMVJDIWE569j' ];
		function decode_data(C_DATA, key, default_key) {
			// console.log(C_DATA);
			// @see https://www.ohmanhua.com/js/custom.js
			C_DATA = decode_base64(C_DATA);

			var KEY_list = default_READKEY_list.clone();
			if (typeof default_key === 'string' && default_key)
				KEY_list.unshift(default_key);
			if (key)
				KEY_list.unshift(key);

			for (var index = 0; index < KEY_list.length; index++) {
				// @search `if (typeof C_DATA !=` ...) { eval( @
				// https://www.ohmanhua.com/js/custom.js
				try {
					var DECRIPT_DATA = crawler.__cdecrypt(KEY_list[index],
							C_DATA);
					if (DECRIPT_DATA)
						return DECRIPT_DATA;
				} catch (e) {
				}
			}

			return C_DATA;
		}

		function decode(C_DATA) {
			C_DATA = decode_data(C_DATA);
			// console.log(C_DATA);

			var mh_info, image_info;
			eval(C_DATA);

			// https://www.cocomanhua.com/js/custom.js
			// last-modified: 2021-01-29T19:23:11Z
			if (image_info.urls__direct) {
				// Will be `chapter_data.image_list`
				mh_info.image_list = decode_base64(image_info.urls__direct)
						.split("|SEPARATER|").map(function(url) {
							return encodeURI(url);
						});
				// free
				delete image_info.urls__direct;
			}

			// before 2021-01-29T19:23:11Z
			mh_info.image_info = image_info;
			// @see `totalImageCount =
			// parseInt(eval(base64[__Ox97c0e[0x4]](__Ox97c0e[0x3])))` @
			// https://www.ohmanhua.com/js/manga.read.js
			if (mh_info.enc_code1) {
				mh_info.totalimg = eval(decode_data(mh_info.enc_code1));
			}
			if (mh_info.enc_code2) {
				// console.trace(mh_info.enc_code2);
				mh_info.imgpath = decode_data(mh_info.enc_code2,
				// 2020/9/3 前改版
				// @see function __cr_getpice(_0xfb06x4a)
				"fw125gjdi9ertyui", "");
				// console.trace(mh_info.imgpath);
				// free
				delete mh_info.enc_code2;
			}
			return mh_info;
		}

		var chapter_data = html.between("var C_DATA='", "'");
		// console.log(chapter_data);
		if (!chapter_data || !(chapter_data = decode(chapter_data))) {
			CeL.warn(work_data.title + ' #' + chapter_NO
					+ ': No valid chapter data got!');
			return;
		}
		// console.log(chapter_data);
		chapter_data = Object.assign(work_data.chapter_list[chapter_NO - 1],
				chapter_data);

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

		if (!chapter_data.image_list) {
			// https://www.cocomanhua.com/js/custom.js
			// last-modified: 2021-01-29T19:23:11Z
			chapter_data.image_list = [];
			for (; image_NO <= chapter_data.totalimg; image_NO++) {
				// @see __cr.PrefixInteger()
				var image_url = chapter_image_base_path + image_NO.pad(4)
						+ ".jpg";
				if (this.using_webp) {
					// @see __cr.switchWebp()
					image_url += '.webp';
				}
				chapter_data.image_list.push(image_url);
			}
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
