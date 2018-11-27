/**
 * 批量下載 漫画160网 的工具。 Download mh160 comics.
 * 
 * modify from 733mh.js
 * 
 * @see qTcms 晴天漫画程序 晴天漫画系统 http://manhua.qingtiancms.com/
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

// https://stackoverflow.com/questions/20082893/unable-to-verify-leaf-signature
// for Error: unable to verify the first certificate
// code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 本站常常無法取得圖片，因此得多重新檢查。
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。
	// recheck : true,
	// 當無法取得chapter資料時，直接嘗試下一章節。在手動+監視下recheck時可併用此項。
	// skip_chapter_data_error : true,

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// one_by_one : true,

	// 2018/6/4 6:34 最後一次成功存取 http://www.733mh.com/
	// 之後更改域名
	base_URL : 'http://www.mh160.com/',
	charset : 'gb2312',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'e/search/?key=',
	parse_search_result : function(html) {
		var id_list = [], id_data = [], matched, PATTERN =
		//
		/<a href="\/kanmanhua\/(\d+)\/?" title="([^"<>]+)">/g;
		while (matched = PATTERN.exec(html)) {
			id_list.push(+matched[1]);
			id_data.push(matched[2]);
		}
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'kanmanhua/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(
			//
			html.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			description : get_label(html.between(
					'<div class="introduction" id="intro1">', '</div>'))
		};
		// 由 meta data 取得作品資訊。
		extract_work_data(work_data, html);
		extract_work_data(work_data, html.between('<div class="info">',
				'<div class="info_cover">'),
				/<em>([^<>]+?)<\/em>([\s\S]*?)<\/p>/g);

		work_data.author = work_data.原著作者;
		work_data.last_update = work_data.更新时间;
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between('<div class="w980_b1px mt10 clearfix">',
				'<div class="introduction" id="intro1">').between('<ul>',
				'</ul>');
		/**
		 * e.g., <code>
		<li><a href="/mh/27576/359123.html" title="179：失踪">179：失踪</a></li>
		</code>
		 */
		work_data.chapter_list = [];
		work_data.inverted_order = true;
		var matched, PATTERN_chapter =
		// [ , chapter_url, chapter_title ]
		/<a href="(\/kanmanhua\/[^<>"]+)" title="([^<>"]+)"/g;
		while (matched = PATTERN_chapter.exec(html)) {
			work_data.chapter_list.push({
				url : matched[1],
				title : get_label(matched[2])
			});
		}
	},

	parse_chapter_data : function(html, work_data) {
		// showPic() @
		// http://www.mh160.com/template/skin4_20110501/js/mh160style/cartoon_detail_scroll.js

		// window["eval"], window["\x65\x76\x61\x6c"]
		var chapter_data = html.between('window["\\x65\\x76\\x61\\x6c"]',
				'</script>');
		if (chapter_data) {
			// use String.prototype.splic
			chapter_data = eval(chapter_data).between("picTree='", "'");
		} else {
			chapter_data = html.between('picTree ="', '"');
		}
		// console.log(chapter_data);
		if (chapter_data) {
			// getUrlpics() @
			// http://www.mh160.com/template/skin4_20110501/js/mh160style/base64.js
			chapter_data = chapter_data.includes('mh160tuku')
			// e.g., https://www.mh160.com/kanmanhua/203/248562.html
			|| chapter_data.includes('$qingtiandy$') ? chapter_data
			// 對於非utf-8編碼之中文，不能使用 atob()
			: base64_decode(chapter_data);
		}
		// console.log(chapter_data);
		if (!chapter_data) {
			CeL.log('無法解析資料！');
			return;
		}

		// getUrlpics() @
		// http://www.mh160.com/template/skin4_20110501/js/mh160style/base64.js
		if (chapter_data.includes("JLmh160")) {
			// https://www.mh160.com/template/skin4_20110501/js/mh160style/cartoon_common.js
			chapter_data = ithmsh(chapter_data);
		} else if (chapter_data.includes("TWmh160")) {
			// https://www.mh160.com/template/skin4_20110501/js/mh160style/jquery.jstore-min.js
			chapter_data = itwrnm(chapter_data);
		}
		chapter_data = chapter_data.split("$qingtiandy$");

		// console.log(JSON.stringify(chapter_data));
		// console.log(chapter_data.length);
		// CeL.set_debug(6);

		// 設定必要的屬性。
		chapter_data = {
			image_list : chapter_data.map(function(url) {
				// console.log(url);
				url = encodeURI(url);
				return {
					// url.includes('://'):
					// e.g., https://www.mh160.com/kanmanhua/203/248562.html
					url : url.includes('://') ? url : getpicdamin(work_data.id,
							html.between("currentChapterid = '", "'"))
							+ url
				};
			}, this)
		};
		// console.log(JSON.stringify(chapter_data));

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

// http://www.mh160.com/template/skin4_20110501/js/mh160style/base64.js
function getpicdamin(cid, currentChapterid) {
	var yuming;
	if (parseInt(cid) > 10000) {
		yuming = "https://mhpic6.lineinfo.cn";
	} else {
		yuming = "https://mhpic7.lineinfo.cn";
	}
	if (parseInt(currentChapterid) > 542724) {
		yuming = "https://mhpic5.lineinfo.cn";
	}
	return yuming;
}
function base64_decode(data) {
	var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, dec = "", tmp_arr = [];
	if (!data) {
		return data;
	}
	data += '';
	do {
		h1 = b64.indexOf(data.charAt(i++));
		h2 = b64.indexOf(data.charAt(i++));
		h3 = b64.indexOf(data.charAt(i++));
		h4 = b64.indexOf(data.charAt(i++));
		bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
		o1 = bits >> 16 & 0xff;
		o2 = bits >> 8 & 0xff;
		o3 = bits & 0xff;
		if (h3 == 64) {
			tmp_arr[ac++] = String.fromCharCode(o1);
		} else if (h4 == 64) {
			tmp_arr[ac++] = String.fromCharCode(o1, o2);
		} else {
			tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
		}
	} while (i < data.length);
	dec = tmp_arr.join('');
	dec = utf8_decode(dec);
	return dec;
}
function utf8_decode(str_data) {
	var tmp_arr = [], i = 0, ac = 0, c1 = 0, c2 = 0, c3 = 0;
	str_data += '';
	while (i < str_data.length) {
		c1 = str_data.charCodeAt(i);
		if (c1 < 128) {
			tmp_arr[ac++] = String.fromCharCode(c1);
			i++;
		} else if ((c1 > 191) && (c1 < 224)) {
			c2 = str_data.charCodeAt(i + 1);
			tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
			i += 2;
		} else {
			c2 = str_data.charCodeAt(i + 1);
			c3 = str_data.charCodeAt(i + 2);
			tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12)
					| ((c2 & 63) << 6) | (c3 & 63));
			i += 3;
		}
	}
	return tmp_arr.join('');
}

String.prototype.splic = function(sp) {
	return base64_decode(this).split(sp);
};

// --------------------------

function ithmsh(nummhstr) {
	var x, num_out, num_in, str_out, realstr;
	x = nummhstr.replaceAll1("JLmh160", "");
	realstr = x;

	var PicUrlArr1 = x.split("$qingtiandy$");
	for (var k = 0; k < PicUrlArr1.length; k++) {
		str_out = "";
		num_out = PicUrlArr1[k];
		for (var i = 0; i < num_out.length; i += 2) {
			num_in = parseInt(num_out.substr(i, [ 2 ])) + 23;
			num_in = unescape('%' + num_in.toString(16));
			str_out += num_in;
		}
		realstr = realstr.replaceAll1(num_out, unescape(str_out));

	}
	// consoloe.log(realstr);
	return realstr;

}

String.prototype.replaceAll1 = function(oldstring, newstring) {
	return this.replace(new RegExp(oldstring, "gm"), newstring);
}

// --------------------------

function itwrnm(nummhstr) {
	var x, text, realstr;
	x = nummhstr.replaceAll1("TWmh160", "");
	realstr = x;
	var PicUrlArr1 = x.split("$qingtiandy$");
	for (var k = 0; k < PicUrlArr1.length; k++) {
		last = "";
		text = PicUrlArr1[k];
		last = jsff(text, z$)
		realstr = realstr.replaceAll1(text, last);

	}
	return realstr;
}

start_crawler(crawler, typeof module === 'object' && module);
