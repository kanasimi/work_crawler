/**
 * 批量下載HH漫画 汗汗酷漫的工具。 Download hhcool comics.
 * 
 * TODO: http://www.hhmmoo.com/
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

/**
 * e.g., <code>
 <div class='cVolTag'>周刊杂志每周每月连载单集</div><ul class='cVolUl'><li>...</a></li></ul>
 <div class='cVolTag'>漫画正片外的剧情之番外篇</div><ul class='cVolUl'><li>...</a></li></ul>

 <li><a class='l_s' href='/cool282192/1.html?s=7' target='_blank' title='双星之阴阳师09卷'>双星之阴阳师09卷</a></li>
 </code>
 */
// matched: [all, part_title, url, title, inner]
var PATTERN_chapter = /<div class='cVolTag'>([^<>]+)|<li><a [^<>]*?href='([^'<>]+)'[^<>]*? title='([^'<>]+)'[^<>]*>(.+?)<\/a>/g,
//
crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 本站常常無法取得圖片，因此得多重新檢查。
	// 當有多個分部的時候才重新檢查。
	recheck : 'multi_parts_changed',
	// 當無法取得chapter資料時，直接嘗試下一章節。在手動+監視下recheck時可併用此項。
	// skip_chapter_data_error : true,

	// 當圖像不存在 EOI (end of image) 標記，或是被偵測出非圖像時，依舊強制儲存檔案。
	// allow image without EOI (end of image) mark. default:false
	allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// 最小容許圖案檔案大小 (bytes)。
	// 對於極少出現錯誤的網站，可以設定一個比較小的數值，並且設定.allow_EOI_error=false。因為這類型的網站要不是無法取得檔案，要不就是能夠取得完整的檔案；要取得破損檔案，並且已通過EOI測試的機會比較少。
	// 對於有些圖片只有一條細橫桿的情況。
	MIN_LENGTH : 400,

	// one_by_one : true,
	// base_URL : 'http://www.hhcool.com/',
	// 2018/4/27? 汗汗酷漫更改域名。最後一次存取: 2018/4/27 14:18
	// http://www.hheehh.com/
	// http://www.huhumh.com/
	base_URL : 'http://www.hhimm.com/',

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
	parse_work_data : function(html, get_label, extract_work_data) {
		html = html.between('<div id="about_kit">', '<div class="cVolList">');
		html = html.between(null, '<div class="cInfoAct">') || html;

		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>'))

		// 選擇性屬性：須配合網站平台更改。
		// <meta property="og:novel:status" content="已完结"/>
		};
		extract_work_data(work_data, html, /<li>([^:]+)(.+?)<\/li>/g);
		work_data.status = work_data.状态;
		work_data.last_update = work_data.更新;
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between('<div class="cVolList">', '<div id="foot">');

		work_data.chapter_list = [];
		// 漫畫目錄名稱不須包含分部號碼。使章節目錄名稱不包含 part_NO。
		work_data.chapter_list.add_part_NO = false;
		work_data.chapter_list.part_NO = 0;

		var matched, part_title;
		while (matched = PATTERN_chapter.exec(html)) {
			// delete matched.input;
			// console.log(matched);
			if (matched[1]) {
				part_title = get_label(matched[1]);
				work_data.chapter_list.part_NO++;
				continue;
			}

			work_data.chapter_list.unshift({
				part_title : part_title,
				title : get_label(matched[3].replace(work_data.title, '')),
				url : matched[2]
			});
		}

		// console.log(work_data.chapter_list);
		return;
	},

	pre_parse_chapter_data
	// 執行在解析章節資料 process_chapter_data() 之前的作業 (async)。
	// 必須自行保證執行 callback()，不丟出異常、中斷。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		var html = XMLHttp.responseText;

		var chapter_list = [], URL = XMLHttp.responseURL,
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
			CeL.get_URL_cache(url, function(html, error) {
				if (error) {
					CeL.error('下載時發生錯誤，無法順利取得檔案內容！');
					CeL.error(error);
					_this.onerror(error);
					return;
				}

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
						_this.onerror('Different url: '
						//
						+ this_image_list[index] + ' !== ' + image_data[0]
						//
						+ '\n或許是下載的檔案出現錯誤？您可嘗試過段時間再下載，'
						//
						+ '或選用 "recheck" 選項來忽略 cache、重新下載每個圖片的頁面。');
						run_next();
						return;
					}
				}
				if (image_data[1] !== '\x00') {
					this_image_list[index + 1] = image_data[1];
				}
				// console.log([ index, image_data ])

				run_next();
			}, {
				get_URL_options : _this.get_URL_options,
				no_write_info : true,
				file_name : save_to,
				reget : _this.recheck
			});
		}, callback);
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var PATTERN = / id="hdDomain"(?:.*?) value="([^<>"]+)"/,
		// 不同作品放在不同的location。
		matched = html.match(PATTERN);
		this.server_list = matched[1].split('|');

		var chapter_data = work_data.chapter_list[chapter_NO - 1];

		// console.log(work_data.image_list[chapter_NO]);
		chapter_data.image_list = work_data.image_list[chapter_NO]
				.map(function(url) {
					return encodeURI(CeL.HTML_to_Unicode(url));
				});

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

// 創建 main directory。
CeL.create_directory(crawler.main_directory);

var decode_filename = 'script/view.js', unsuan;
CeL.get_URL_cache(crawler.base_URL + decode_filename,
		function(contents, error) {
			// eval('unsuan=function' + contents.between('function unsuan',
			// '\nvar'));
			start_crawler(crawler, typeof module === 'object' && module);
		}, crawler.main_directory + decode_filename.match(/[^\\\/]+$/)[0]);
