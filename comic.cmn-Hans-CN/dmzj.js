/**
 * 批量下載动漫之家漫画网 原创+漫画频道(日漫)的工具。 Download www.dmzj, manhua.dmzj comics.
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

	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	// skip_error : true,

	// one_by_one : true,
	base_URL : 'http://www.dmzj.com/',
	base_URL_manhua : 'http://manhua.dmzj.com/',

	// 解析 作品名稱 → 作品id get_work()
	// TODO: https://www.dmzj.com/dynamic/o_search/index
	search_URL : 'http://s.acg.dmzj.com/comicsum/search.php?s=',
	parse_search_result : function(html) {
		// e.g.,
		// var g_search_data =
		// [{"id":"13318","name":"\u53cc\u661f\u4e4b\u9634\u9633\u5e08","alias_name":"\u53cc\u661f\u306e\u9634\u9633\u5e08","real_name":"","publish":null,"type":null,"zone":"\u65e5\u672c","zone_tag_id":"2304","language":"\u4e2d\u6587","status":"","status_tag_id":"2309","last_update_chapter_name":"\u7b2c10\u5377","last_update_chapter_id":"62693","last_updatetime":"1504067298","check":"0","chapters_tbl":"comics_chapter_3","description":"\u8981\u5b88\u62a4\u7684\u5c31\u8981\u632f\u594b\u8d77\u6765\uff01\u6211\u8981\u7528\u7684\u624b\u548c\u6211\u7684\u5251\u5b88\u62a4\u8fd9\u4e2a\u4e16\u754c\uff01","hidden":"0","cover":"http:\/\/images.dmzj.com\/webpic\/8\/160131shuangxing2fml.jpg","sum_chapters":"65","sum_source":"3202","hot_search":"1","hot_hits":"1810266","first_letter":"s","keywords":"","comic_py":"sxzyys","introduction":"\u8981\u5b88\u62a4\u7684\u5c31\u8981\u632f\u594b\u8d77\u6765\uff01\u6211\u8981\u7528\u7684\u624b\u548c\u6211\u7684\u5251\u5b88\u62a4\u8fd9\u4e2a\u4e16\u754c\uff01","addtime":null,"authors":"\u52a9\u91ce\u5609\u662d","types":"\u5192\u9669\/\u795e\u9b3c","series":"","need_update":"0","update_notice":"","readergroup":"\u5c11\u5e74\u6f2b\u753b","readergroup_tag_id":"3262","has_comment_id":"1","comment_key":"","day_click_count":"1211","week_click_count":"6371","month_click_count":"39610","page_show_flag":"0","token":"MxFF9s","source":"\u8f6c\u8f7d","grade":"0","copyright":"0","direction":"1","token32":"018857b0e318c1004deb94f5b083b32a","url":"","mobile":"1","w_link":"2","app_day_click_count":"2","app_week_click_count":"92","app_month_click_count":"2268","app_click_count":"1278044","islong":"2","alading":"1","uid":null,"week_add_num":"1","month_add_num":"1","total_add_num":"0","sogou":"2","baidu_assistant":"0","is_checked":"1","quality":"1","is_show_animation_list":"0","zone_link":"","is_dmzj":"0","device_show":"7","comic_name":"\u53cc\u661f\u4e4b\u9634\u9633\u5e08","comic_author":"\u52a9\u91ce\u5609\u662d","comic_cover":"http:\/\/images.dmzj.com\/webpic\/8\/160131shuangxing2fml.jpg","comic_url_raw":"http:\/\/manhua.dmzj.com\/sxzyys","comic_url":"http:\/\/manhua.dmzj.com\/sxzyys","chapter_url_raw":"http:\/\/manhua.dmzj.com\/sxzyys\/62693.shtml","chapter_url":"http:\/\/manhua.dmzj.com\/..\/sxzyys\/62693.shtml"}];
		var id_data = html ? JSON.parse(html.between('var g_search_data = ',
				';')) : [];
		return [ id_data, id_data ];
	},
	id_of_search_result : function(data) {
		return data.comic_url.includes('manhua.dmzj') ? 'manhua_'
				+ data.comic_py : data.comic_py;
	},
	title_of_search_result : 'name',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		// e.g., http://manhua.dmzj.com/sxzyys ,
		// https://www.dmzj.com/info/yaoshenji.html
		var matched = work_id.match(/^manhua_(.+)$/);
		return matched ? this.base_URL_manhua + matched[1] : 'info/' + work_id
				+ '.html';
	},
	parse_work_data : function(html, get_label, exact_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>'))
			// is_manhua
			|| html.between('g_comic_name = "', '"')

		// 選擇性屬性：須配合網站平台更改。
		// <meta property="og:novel:status" content="已完结"/>
		};
		// 由 meta data 取得作品資訊。
		exact_work_data(work_data, html);
		exact_work_data(work_data, html.between('<ul class="comic_deCon_liO">',
				'</ul>'), /<li>([^<>：]+)(.+?)<\/li>/g);
		// is_manhua
		exact_work_data(work_data, html.between('<div class="anim-main_list">',
				'</div>'), /<th>([^<>]+?)<\/th>[\s\n]*<td>(.+?)<\/td>/g);
		work_data.status = work_data.状态;
		work_data.last_update = work_data.最新收录
		//
		.match(/\d+-\d{1,2}-\d{1,2}$/)[0];
		return work_data;
	},
	get_chapter_count : function(work_data, html, get_label) {
		html = html.between('<ul class="list_con_li autoHeight">', '</ul>')
				// is_manhua
				|| html.between('<div class="middleright_mr">',
						'<!--middleright_mr-->');

		work_data.chapter_list = [];
		var is_manhua = work_data.id.startsWith('manhua_'), matched,
		/**
		 * e.g., <code>
		<li><a title="双星之阴阳师-第01话" href="/sxzyys/25213.shtml" >第01话</a>
		</li>
		</code>
		 */
		PATTERN_chapter = is_manhua ?
		// [all,title,href,inner]
		/<li><a title="([^"<>]+)" href="([^"<>]+)"[^<>]*>(.+?)<\/a>/g :
		// [all,href,title,inner]
		/<li><a href="([^"<>]+)" target="_blank" title="([^"<>]+)"[^<>]*>(.+?)<\/a>/g
		//
		;
		while (matched = PATTERN_chapter.exec(html)) {
			if (is_manhua) {
				work_data.chapter_list.push({
					title : get_label(matched[3]),
					url : this.base_URL_manhua + encodeURI(matched[2])
				});
			} else {
				work_data.chapter_list.unshift({
					title : get_label(matched[3]),
					url : matched[1]
				});
			}
		}

		return;
	},

	parse_chapter_data : function(html, work_data, get_label) {
		// decode chapter data
		function decode(code) {
			code = eval(code);
			var pages;
			eval(code.replace('var ', ''));

			pages = JSON.parse(pages.replace(/\r\n/g, '|'));
			if (pages.page_url) {
				// is_manhua===false
				pages = pages.page_url.split('|');
			}
			return pages;
		}

		var matched = work_data.id.match(/^manhua_(.+)$/), chapter_data = {
			// 設定必要的屬性。
			title : get_label(html.between('g_chapter_name = "', '"')
			// ↑ is_manhua
			|| html.between('<h2>', '</h2>')),

			// for is_manhua only
			// image_count : +html.between('g_max_pic_count =', ';'),

			image_list : decode(html.between('<script type="text/javascript">',
			//
			'</script>').between('eval', '\n')).map(function(url) {
				return {
					// 指定圖片要儲存檔的檔名。
					file : function(work_data, chapter, index) {
						return (matched ? matched[1] : work_data.id)
						// @see function process_images() @
						// CeL.application.net.work_crawler
						+ '-' + chapter + '-' + (index + 1).pad(3) + '.jpg'
					},
					url : 'http://images.dmzj.com/'
					//
					+ encodeURI(CeL.HTML_to_Unicode(url))
				}
			})
		};

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
