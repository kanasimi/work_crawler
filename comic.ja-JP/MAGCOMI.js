/**
 * 批量下載 MAGCOMI(マグコミ) 的工具。 Download MAG Garden COMIC ONLINE.
 * 
 * @see ActiBook https://ebook.digitalink.ne.jp/
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 日本的線上漫畫網站習慣刪掉舊章節，因此每一次都必須從頭檢查。
	recheck : true,

	// 當網站不允許太過頻繁的訪問/access時，可以設定下載之前的等待時間(ms)。
	// 常常下載到十幾二十個作品後中斷連線出現錯誤。
	chapter_time_interval : '1s',

	// one_by_one : true,
	base_URL : 'https://comic.mag-garden.co.jp/',

	// 規範 work id 的正規模式；提取出引數中的作品id 以回傳。
	extract_work_id : function(work_information) {
		if (/^[a-z_\-\d]+$/.test(work_information))
			return work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : '?s=',
	parse_search_result : function(html, get_label) {
		var id_list = [], id_data = [];
		html.each_between('<p class="cont post">', '</div>',
		//
		function(text) {
			var url = text.match(/ href="([^<>"]+)"/),
			//
			title = get_label(text.between('<h2>', '</h2>'));
			id_list.push(url[1].match(/\/([a-z_\-\d]+)\/$/)[1]);
			id_data.push(title);
		});

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			author : get_label(html.between('<small>著者:</small>', '</h3>')),

			// 選擇性屬性：須配合網站平台更改。
			status : html.between('<ul class="article-tags">', '</ul>')
					.all_between('<li>', '</li>').map(get_label),
			last_update : get_label(html.between('<h2 class="clearfix">',
					'</h2>').between('<time datetime="', '"'))
					|| (new Date).toISOString(),
			next_update : get_label(html.between(
			// 次回の更新予定は12月30日です。
			'<p class="article-next">', '</p>'))
		};

		// 連載は終了しました。
		if (work_data.next_update.includes('終了')) {
			work_data.status.unshift('終了');
		}

		extract_work_data(work_data, html);

		// 放在這裡以預防被extract_work_data()覆蓋。
		Object.assign(work_data, {
			description : get_label(html.between('<div class="feature">',
					'</div>'))
		});

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		var matched, PATTERN_chapter = /<a href="([^"]+)"[^<>]*>(.+?)<\/a>/g;

		html = html.between('<div class="container-fluid">', '</section>');

		work_data.chapter_list = [];
		while (matched = PATTERN_chapter.exec(html)) {
			var basePath = matched[1].replace(/\/HTML5\/.+/, '/');
			var chapter_data = {
				base_URL : basePath,
				url : basePath + 'iPhone/ibook.xml',
				title : get_label(matched[2])
			};
			work_data.chapter_list.push(chapter_data);
		}
		work_data.chapter_list.reverse();

		// 因為中間的章節可能已經被下架，因此依章節標題來定章節編號。
		this.set_chapter_NO_via_title(work_data);
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// @see loadPageData @
		// https://comic.mag-garden.co.jp/assets/files/work_id/HTML5/assets/javascripts/application.js
		// imageSource = pieceDirectory + "/" + pageno + ".jpg";
		// pieceDirectory = baseDirectory + "/" + scale
		// parseDefinition: baseDirectory = basePath + "/books/images"
		// basePath = '..'
		// scale = 2

		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		Object.assign(chapter_data, {
			// 設定必要的屬性。
			title : get_label(html.between('<name>', '</name>')),
			image_count : html.between('<total>', '</total>') | 0,
			image_list : []
		});

		for (var index = 0; index < chapter_data.image_count;) {
			chapter_data.image_list.push({
				url : chapter_data.base_URL + 'books/images/2/' + ++index
						+ '.jpg'
			});
		}

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
