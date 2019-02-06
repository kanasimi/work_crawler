/**
 * 批量下載 KADOKAWAの無料漫画（マンガ） コミックウォーカー ComicWalker 的工具。 Download comic-walker
 * comics.
 * 
 * @see ニコニコ静画 http://www.nicoseiga.jp/
 * 
 * <code>

ComicWalker 對圖片的處理:

ComicWalker 會將圖片存在像是這樣子路徑的檔案:
https://drm.nicoseiga.jp/image/78c60478495c13061ecccd6a493c6317f9485fed_17746/8371673p
每個檔案代表一張圖片

解碼機制全部都放在
https://cdn.comic-walker.com/viewer/cw-viewer.min.js?20180424


從圖片檔案 URL 的 drm_hash 可以生成 decode image 用的關鍵 key:

this.generateKey(n)
// this.generateKey("78c60478495c13061ecccd6a493c6317f9485fed_17746")
key: "generateKey",
value: function(t) {
	var e = t.slice(0, 16).match(/[\da-f]{2}/gi);
	if (null != e)
		return new Uint8Array(e.map(function(t) {
			return parseInt(t, 16)
		}));
	throw new Error("failed generate key.")
}


之後會用 this.decodeFromBlob(e, r); 來解碼圖片資料的每個位元:
xor({Blob}圖片資料 → {ArrayBuffer}, {Uint8Array(8)} 關鍵 key)

key: "xor",
value: function(t, e) {
	for (var n = new Uint8Array(t), r = n.length, i = e.length, o = new Uint8Array(r), a = 0; a < r; a += 1)
		o[a] = n[a] ^ e[a % i];
	return o
}

經過xor轉換即可還原先的圖片。



// for trace:
var reader = new FileReader();
reader.addEventListener("loadend", function() {
	// reader.result contains the contents of blob as a typed array
	// https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/DataView
	var dataView = new DataView(reader.result);
	hex_array = [];
	for (var i = 0; i < dataView.byteLength; i++)
		hex_array.push(dataView.getUint8(i).toString(16));
	// var textDecoder = new TextDecoder('iso-8859-2');
	// string = textDecoder.decode(dataView);
});
blob = t.sent;
reader.readAsArrayBuffer(blob);


 * </code>
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 日本的線上漫畫網站習慣刪掉舊章節，因此每一次都必須從頭檢查。
	recheck : true,

	// one_by_one : true,
	base_URL : 'https://comic-walker.com/',

	// 規範 work id 的正規模式；提取出引數中的作品id 以回傳。
	extract_work_id : function(work_information) {
		// e.g., KDCW_KS02000043010000_68
		if (/^KDCW_[A-Z_\d]+$/.test(work_information))
			return work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'contents/search/?q=',
	parse_search_result : function(html, get_label) {
		html = html.between('<ul class="tileList', '</ul>');

		var id_list = [], id_data = [];
		html.each_between('<li', '</li>', function(text) {
			var url = text.match(/ href="([^<>"]+)"/), title = get_label(text
					.between('<h2', '</h2>').between('>'));
			id_list.push(url[1].match(/\/([a-zA-Z\d_]+)\/$/)[1]);
			id_data.push(title);
		});

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'contents/detail/' + work_id + '/';
	},
	// ComicWalker 2018/10/16? 更新
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。

			// <div class="acItem-copy">
			// <a href="/contents/author/2442/">濃口kiki(漫画)</a><a
			// href="/contents/author/2566/">犬魔人(原作)</a><a
			// href="/contents/author/2567/">こちも(キャラクター原案)</a> <div
			// class="acItem-copy-inner"><span>©Koikuchi Kiki ©Inumajin
			// ©Kochimo</span></div>
			authors : html.between('<div class="acItem-copy">', '</div>')
					.split(/<\/a>\s*\/?/).filter(function(author) {
						return !!author;
					}).map(get_label).map(function(author) {
						return author.replace(/\([^()]+\)$/, '');
					}),
			last_update : get_label(html.between(
					'<span class="comicIndex-date">', '</span>').replace('更新',
					'')),
			latest_chapter : get_label(html.between(
					'<p class="comicIndex-title">', '</p>')),
			next_update : get_label(html.between(
			// 【次回更新予定】2018/11/16
			'<span class="comicIndex-nextTime">', '</span>').replace(
					'【次回更新予定】', ''))
		};
		// e.g., "濃口kiki,犬魔人,こちも,©Koikuchi Kiki ©Inumajin ©Kochimo"
		// → "濃口kiki,犬魔人,こちも"
		work_data.author = work_data.authors.slice(0, -1);

		extract_work_data(work_data, html);
		if (work_data.site_name) {
			// "ComicWalker - 人気マンガが無料で読める！" → "ComicWalker"
			work_data.site_name = work_data.site_name.replace(/ +- .+/, '');
		}

		// 因為沒有明確記載作品是否完結，一年沒更新就不再檢查。
		work_data.recheck_days = 400;

		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		// バックナンバー
		// <ul class="acBacknumber-list first-preview clearfix" id="reversible">
		html = html.between('<ul class="acBacknumber-list', '<section>');
		work_data.chapter_list = [];
		html.each_between('<li', '</li>', function(text) {
			var matched = text.match(/<a title="([^<>"]+)" href="([^<>"]+)"/);
			work_data.chapter_list.push({
				// matched[1].replace(work_data.title, '')
				title : get_label(text.between(
						'<span class="acBacknumber-title">', '</span>')
						+ ' '
						+ text.between('<h3 class="acBacknumber-subtitle">',
								'</h3>')),
				cid : matched[2].match(/cid=([a-zA-Z\d_]+)/)[1],
				url : matched[2]
			});
		});
		// work_data.chapter_list.reverse();

		// 因為中間的章節可能已經被下架，因此依章節標題來定章節編號。
		this.set_chapter_NO_via_title(work_data);
	},

	chapter_URL : function(work_data, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		return 'https://ssl.seiga.nicovideo.jp/api/v1/comicwalker/episodes/'
				+ chapter_data.cid + '/frames';
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		html = JSON.parse(html);

		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		chapter_data.image_list = html.data.result;
		chapter_data.image_list.forEach(function(image_data) {
			image_data.url = image_data.meta.source_url;
		});

		return chapter_data;
	},
	image_preprocessor : function(contents, image_data) {
		if (!contents)
			return;
		// console.log(image_data);
		if (image_data.meta.drm_hash === null) {
			// e.g., 英雄の娘として生まれ変わった英雄は再び英雄を目指す
			// 這情況下所獲得的圖片內容似乎不用解碼？
			// CeL.warn('Bad image data?');
			// console.log(image_data);
			return;
		}

		var decode_key = image_data.meta.drm_hash.slice(0, 16)
		// decode image 用的關鍵 key
		.match(/[\da-f]{2}/gi).map(function(t) {
			return parseInt(t, 16);
		});
		for (var index = 0, length = contents.length; index < length; index++) {
			// 8 === decode_key.length
			contents[index] ^= decode_key[index % 8];
		}
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
