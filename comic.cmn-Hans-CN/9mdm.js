/**
 * 批量下載 9妹漫画网 的工具。 Download 9mdm comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// one_by_one : true,
	base_URL : 'http://www.9mdm.com/',
	// fs.readdirSync('.').forEach(function(d){if(/^\d+\s/.test(d))fs.renameSync(d,'manhua-'+d);})
	// fs.readdirSync('.').forEach(function(d){if(/^manhua-/.test(d))fs.renameSync(d,d.replace(/^manhua-/,''));})
	// 所有作品都使用這種作品類別前綴。
	use_work_id_prefix : 'manhua',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return [ this.base_URL + 'e/search/index.php', {
			show : 'title,writer',
			tempid : 1,
			tbname : 'sinfo',
			keyboard : work_title
		} ];
	},
	parse_search_result : function(html, get_label) {
		// console.log(html);
		html = html.between('<div class="cy_list">', '</div>');
		var id_list = [], id_data = [];
		html.each_between('<li class="title">', '</li>', function(token) {
			// console.log(token);
			var matched = token.match(
			//
			/<a href="\/([a-z]+\/[a-z_\-\d]+)\/"[^<>]*?>([^<>]+)/);
			// console.log(matched);
			if (this.use_work_id_prefix
			// 去掉所有不包含作品類別前綴者。
			&& !matched[1].startsWith(this.use_work_id_prefix + '/'))
				return;
			id_list.push(this.use_work_id_prefix
			//
			? matched[1].slice((this.use_work_id_prefix + '/').length)
					: matched[1].replace('/', '-'));
			id_data.push(get_label(matched[2]));
		}, this);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return (this.use_work_id_prefix ? this.use_work_id_prefix + '/'
				+ work_id : work_id.replace('-', '/'))
				+ '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// console.log(html);
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			description : get_label(html.between(' id="comic-description">',
					'</')),
			last_update_chapter : get_label(html.between('<p>最新话：', '</p>'))
		};

		extract_work_data(work_data, html);
		extract_work_data(work_data, html.between('<h1>',
				' id="comic-description">'),
				/<span>([^<>：]+)：([\s\S]*?)<\/span>/g);

		Object.assign(work_data, {
			author : work_data.作者,
			status : work_data.状态,
		});

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between('<div class="cy_plist', '</div>');

		var matched, PATTERN_chapter =
		//
		/<li><a href="([^<>"]+)"[^<>]*>([\s\S]+?)<\/li>/g;

		work_data.chapter_list = [];
		while (matched = PATTERN_chapter.exec(html)) {
			var chapter_data = {
				url : matched[1],
				title : get_label(matched[2])
			};
			work_data.chapter_list.push(chapter_data);
		}
		work_data.chapter_list.reverse();
	},

	pre_parse_chapter_data
	// 執行在解析章節資料process_chapter_data()之前的作業(async)。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		//
		url = this.full_URL(chapter_data.url), html = XMLHttp.responseText,
		//
		image_count = html.between('totalpage =', ';').trim(), _this = this;
		// e.g., http://www.9mdm.com/manhua/4353/141236.html
		image_count = image_count === '[!--diypagenum--]' ? 1 : +image_count;

		if (!(image_count >= 0)) {
			throw work_data.title + ' #' + chapter_NO + ' '
					+ chapter_data.title + ': Can not get image count!';
		}

		if (work_data.image_list) {
			chapter_data.image_list = work_data.image_list[chapter_NO - 1];
			if (chapter_data.image_list
					&& chapter_data.image_list.length === image_count) {
				CeL.debug(work_data.title + ' #' + chapter_NO + ' '
						+ chapter_data.title + ': Already got ' + image_count
						+ ' images.');
				chapter_data.image_list = chapter_data.image_list.map(function(
						image_data) {
					// 僅保留網址資訊。
					return {
						url : image_data.url
					};
				});
				callback();
				return;
			}
		} else {
			work_data.image_list = [];
		}

		function extract_image(XMLHttp) {
			var html = XMLHttp.responseText,
			// .trim(): for 遮天 第92话 各打算盘
			url = encodeURI(html.between('<div class="mh_list">', '</div>')
					.between(' src="', '"').trim());
			CeL.debug('Add image ' + chapter_data.image_list.length + '/'
					+ image_count + ': ' + url, 1, 'extract_image');
			chapter_data.image_list.push({
				url : url
			});
		}

		chapter_data.image_list = [];
		extract_image(XMLHttp);

		CeL.run_serial(function(run_next, NO, index) {
			var image_page_url = url.replace(/(\.[^.]+)$/, '_' + NO + '$1');
			// console.log('Get #' + index + ': ' + image_page_url);
			process.stdout.write('Get image pages of #' + chapter_NO + ': '
					+ NO + '/' + image_count + '...\r');
			_this.get_URL(image_page_url, function(XMLHttp) {
				extract_image(XMLHttp);
				run_next();
			}, null, true);
		}, image_count, 2, function() {
			work_data.image_list[chapter_NO - 1] = chapter_data.image_list;
			callback();
		});
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		// 已在 pre_parse_chapter_data() 設定完 {Array}chapter_data.image_list
		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
