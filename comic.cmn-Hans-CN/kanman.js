/**
 * 批量下載 鄂州看漫画动漫有限公司 看漫画 的工具。 Download kanman comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

/**
 * <code>

<li class="item" data-id="0" data-chapter="1650644"><a title="第1话 一梦八万年" href="/107447/1.html" target="_self"><div class="img"><img src="//resource.mhxk.com/kanman_pc/static/images/comm/space.gif" data-src="//image.yqmh.com/chapter_cover/107447/1650644.jpg-300x150.jpg" data-error="//image.yqmh.com/mh/107447_2_1.jpg-300x150.jpg" alt="第1话 一梦八万年"> <i class="j_chapter_badge"></i></div><p class="name"><i class="j_chapter_badge"></i>第1话 一梦八万年</p></a></li>

 </code>
 */
var PATTERN_chapter = /<li([^<>]*)><a title="([^<>"]+)" href="([^<>"]+)"[^<>]*>([\s\S]+?)<\/li>/g,
//
crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// {Natural}最小容許圖案檔案大小 (bytes)。
	// MIN_LENGTH : 500,

	// 圖像檔案下載失敗處理方式：忽略/跳過圖像錯誤。當404圖像不存在、檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。default:false
	skip_error : true,

	// 當網站不允許太過頻繁的訪問/access時，可以設定下載之前的等待時間(ms)。
	// 模仿實際人工請求。
	// chapter_time_interval : '1s',

	// one_by_one : true,
	base_URL : 'https://www.kanman.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'api/getsortlist/'
			+ '?product_id=1&productname=kmh&platformname=pc&search_key=',
	parse_search_result : function(html, get_label) {
		html = JSON.parse(html).data;
		return [ html, html ];
	},
	id_of_search_result : 'comic_id',
	title_of_search_result : 'comic_name',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var text = html.between('<div class="content">'), work_data = {
		// 必要屬性：須配合網站平台更改。

		// 選擇性屬性：須配合網站平台更改。
		};

		extract_work_data(work_data, html);

		Object.assign(work_data, {
			description : get_label(text.between('<div class="introduce">',
					'</div>').between('</h2>')),
			last_update : work_data.update_time
		});

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between(' id="j_chapter_list"', '</ol>');

		var matched;

		work_data.chapter_list = [];
		while (matched = PATTERN_chapter.exec(html)) {
			var chapter_data = {
				url : matched[3],
				title : get_label(matched[2])
			};
			if (matched[3].includes('lock')) {
				chapter_data.limited = true;
				work_data.some_limited = true;
			}
			work_data.chapter_list.push(chapter_data);
		}
	},

	// 取得每一個章節的內容與各個影像資料。
	chapter_URL : function(work_data, chapter_NO) {
		var url = new CeL.URI('https://www.kanman.com/api/getchapterinfov2');
		url.search_params.set_parameters({
			product_id : 1,
			productname : "kmh",
			platformname : "pc",
			comic_id : work_data.id,
			chapter_newid : chapter_NO,
			isWebp : 0,
			quality : "high"
		});
		// e.g.,
		// https://www.kanman.com/api/getchapterinfov2?product_id=1&productname=kmh&platformname=pc&comic_id=105967&chapter_newid=2&isWebp=0&quality=high
		//console.trace(url.toString());
		return url.toString();
	},
	pre_parse_chapter_data
	// 執行在解析章節資料 process_chapter_data() 之前的作業 (async)。
	// 必須自行保證執行 callback()，不丟出異常、中斷。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		//
		html = XMLHttp.responseText, _this = this;
		try {
			html = JSON.parse(html).data;
		} catch (e) {
			CeL.warn({
				// gettext_config:{"id":"unable-to-parse-chapter-data-for-«$1»-§$2"}
				T : [ '無法解析《%1》§%2 之章節資料！', work_data.title, chapter_NO ]
			});
			callback();
			return;
		}
		// console.log(html);
		Object.assign(chapter_data, html);
		chapter_data.image_list = chapter_data.current_chapter.chapter_img_list;
		// 減少寫入的資料大小。
		delete chapter_data.current_chapter.chapter_img_list;
		delete chapter_data.prev_chapter;
		delete chapter_data.next_chapter;
		callback();
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
