/**
 * 批量下載HH漫画 汗汗酷漫的工具。 Download hhcool comics.
 * 
 * TODO: http://www.hhmmoo.com/
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 本站常常無法取得圖片，因此得多重新檢查。
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。
	// recheck : true,
	// 當無法取得chapter資料時，直接嘗試下一章節。在手動+監視下recheck時可併用此項。
	// skip_chapter_data_error : true,

	// 當圖像不存在 EOI (end of image) 標記，或是被偵測出非圖像時，依舊強制儲存檔案。
	// allow image without EOI (end of image) mark. default:false
	allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// one_by_one : true,
	base_URL : 'http://www.hhcool.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'comic/?act=search&st=',
	parse_search_result : function(html) {
		html = html.between('<div class="cComicList">', '</div>');
		var id_list = [], id_data = [], matched, PATTERN =
		/**
		 * e.g., <code>
		<li><a title='野生的最终BOSS出现了' href='/manhua/32449.html'><img src='http://img.94201314.net/comicui/32449.JPG'><br>野生的最终BOSS出现了</a></li>
		</code>
		 */
		/<li><a title='([^<>'"]+)' href='\/manhua\/(\d+).html'>.+?<\/li>/g;
		while (matched = PATTERN.exec(html)) {
			id_list.push(+matched[2]);
			id_data.push(matched[1]);
		}
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		// e.g., http://www.hhcool.com/manhua/32449.html
		return 'manhua/' + work_id + '.html';
	},
	parse_work_data : function(html, get_label, exact_work_data) {
		html = html.between('<div id="about_kit">', '<div class="cVolList">');
		html = html.between(null, '<div class="cInfoAct">') || html;

		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>'))

		// 選擇性屬性：須配合網站平台更改。
		// <meta property="og:novel:status" content="已完结"/>
		};
		exact_work_data(work_data, html, /<li>([^:]+)(.+?)<\/li>/g);
		work_data.status = work_data.状态;
		work_data.last_update = work_data.更新;
		return work_data;
	},
	get_chapter_count : function(work_data, html, get_label) {
		html = html.between('<div class="cVolList">', '<div id="foot">');

		work_data.chapter_list = [];
		/**
		 * e.g., <code>
		<li><a class='l_s' href='/cool282192/1.html?s=7' target='_blank' title='双星之阴阳师09卷'>双星之阴阳师09卷</a></li>
		</code>
		 */
		var matched, PATTERN_chapter =
		// [all,href,title,inner]
		/<li><a [^<>]*?href='([^'<>]+)'[^<>]*? title='([^'<>]+)'[^<>]*>(.+?)<\/a>/g
		//
		;
		while (matched = PATTERN_chapter.exec(html)) {
			work_data.chapter_list.unshift({
				title : get_label(matched[2].replace(work_data.title, '')),
				url : matched[1]
			});
		}

		return;
	},

	pre_parse_chapter_data
	// 執行在解析章節資料process_chapter_data()之前的作業(async)。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		var html = XMLHttp.responseText;

		var chapter_list = [], URL = XMLHttp.URL,
		// 每一張圖片都得要從載入的頁面獲得資訊。
		matched, PATTERN = /csel2\((\d{1,3})\)/g;

		while (matched = PATTERN.exec(html)) {
			chapter_list.push(matched[1]);
		}

		work_data.cache_directory = work_data.directory
				+ this.cache_directory_name;
		CeL.create_directory(work_data.cache_directory);
		if (!work_data.image_list) {
			// image_list[chapter_NO] = [url, url, ...]
			work_data.image_list = [];
		}
		var _this = this,
		//
		this_image_list = work_data.image_list[chapter_NO] = [];
		chapter_list.run_async(function(run_next, NO, index) {
			var url = URL.replace(/\/\d{1,3}\.html/, '/' + NO + '.html'),
			//
			save_to = work_data.cache_directory + chapter_NO.pad(3) + '-'
					+ NO.pad(3) + '.html';
			// 沒 cache 的話，每一次都要重新取得每個圖片的頁面，速度比較慢。
			CeL.get_URL_cache(url, function(html) {
				var image_data = html.match(
				//
				/<img (?:.*?) name="([^<>"]+)" (?:.*?)hdNextImg" value="([^<>"]+)"/
				//
				);

				// decode chapter image url data
				image_data = [ unsuan(image_data[1]), unsuan(image_data[2]) ];

				if (image_data[0] !== '\x00') {
					if (!this_image_list[index]) {
						this_image_list[index] = image_data[0];
					} else if (this_image_list[index] !== image_data[0]) {
						throw 'Different url: ' + this_image_list[index]
								+ ' !== ' + image_data[0];
					}
				}
				if (image_data[1] !== '\x00') {
					this_image_list[index + 1] = image_data[1];
				}
				// console.log([ index, image_data ])

				run_next();
			}, {
				get_URL_options : _this.get_URL_options,
				reget : _this.recheck,
				no_write_info : true,
				file_name : save_to
			});
		}, callback);
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var PATTERN = / id="hdDomain"(?:.*?) value="([^<>"]+)"/,
		// 不同作品放在不同的location。
		matched = html.match(PATTERN);
		this.server_list = matched[1].split('|');

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

function unsuan(s) {
	var x = s.substring(s.length - 1);
	var w = "abcdefghijklmnopqrstuvwxyz";
	var xi = w.indexOf(x) + 1;
	var sk = s.substring(s.length - xi - 12, s.length - xi - 1);
	s = s.substring(0, s.length - xi - 12);
	var k = sk.substring(0, sk.length - 1);
	var f = sk.substring(sk.length - 1);
	for (var i = 0; i < k.length; i++) {
		eval("s=s.replace(/" + k.substring(i, i + 1) + "/g,'" + i + "')");
	}
	var ss = s.split(f);
	s = "";
	for (i = 0; i < ss.length; i++) {
		s += String.fromCharCode(ss[i]);
	}
	return s;
}

setup_crawler(crawler, typeof module === 'object' && module);

var decode_filename = 'script/view.js', unsuan;
// 創建 main directory。 C
CeL.create_directory(crawler.main_directory);
CeL.get_URL_cache(crawler.base_URL + decode_filename, function(contents) {
	// eval('unsuan=function' + contents.between('function unsuan', '\nvar'));
	start_crawler(crawler, typeof module === 'object' && module);
}, crawler.main_directory + decode_filename.match(/[^\\\/]+$/)[0]);
