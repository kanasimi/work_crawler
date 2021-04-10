/**
 * 批量下載 講談社 モーニング・アフタヌーン・イブニング合同Webコミックサイト モアイ 的工具。 Download Kodansha moae
 * comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 日本的網路漫畫網站習慣刪掉舊章節，因此每一次都必須從頭檢查。
	recheck : true,

	// one_by_one : true,
	base_URL : 'http://www.moae.jp/',

	// 規範 work id 的正規模式；提取出引數中的作品id 以回傳。
	extract_work_id : function(work_information) {
		if (/^[a-z_\-\d]+$/.test(work_information))
			return work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'comic/list?keyword=',
	parse_search_result : function(html, get_label) {
		html = html.between('<ul class="box-set">', '</ul>');
		var id_list = [], id_data = [];
		html.each_between('<li>', '</li>',
		//
		function(text) {
			var url = text.match(/ href="([^<>"]+)"/),
			//
			title = get_label(text.between('<span class="book-title">',
					'</span>'));
			id_list.push(url[1].match(/\/([a-z_\-\d]+)$/)[1]);
			id_data.push(title);
		});

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'comic/' + work_id;
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			// e.g., "<h3>ジサツナキーの角（四季賞2018夏 佳作）<span>（2018/12/28）</span></h3>"
			author : get_label(html.between(
					'<section class="mod-profile-block">', '</section>')
			// e.g., "<dt>宮川舟<span class="notes">（みやかわふね）</span></dt>"
			.between('<dt>', '<')),

			// 選擇性屬性：須配合網站平台更改。
			last_update : get_label(html.between('<h3>', '</h3>').between(
					'<span>（', '）</span>'))
					|| (new Date).toISOString()
		};

		extract_work_data(work_data, html);
		work_data.title = work_data.title.replace(/\/[^\/]+$/, '');

		// console.log(work_data);
		return work_data;
	},
	pre_get_chapter_list : function(callback, work_data, html, get_label) {
		if (false && !html.includes('<div id="backnumber-pager">')) {
			// 可能只有一個章節。
			work_data.chapter_list = [ {
				episode_no : 1
			} ];
			// return;
		}

		function get_chapter_data_URL(chapter_NO) {
			return work_data.url + '/1/episode_list?page=' + (chapter_NO || '')
					+ '&mpp=15';
		}

		var _this = this;
		function parse_JSON(XMLHttp) {
			try {
				return JSON.parse(XMLHttp.responseText);
			} catch (e) {
				_this.onerror('Can not parse chapter list!', work_data);
				callback();
			}
		}

		this.get_URL(get_chapter_data_URL(), function(XMLHttp) {
			var data = parse_JSON(XMLHttp);
			if (!data)
				return;
			// console.log(data);

			if (!Array.isArray(data.pager) || data.pager.length !== 1) {
				_this.onerror('Unknown data! ' + JSON.stringify(data),
						work_data);
			}
			work_data.pager = data.pager[0];
			work_data.chapter_list = data.ep;

			CeL.run_serial(function(run_next, item, index, list) {
				CeL.log_temporary(item + '/' + work_data.pager.maxPage);

				_this.get_URL(get_chapter_data_URL(item), function(XMLHttp) {
					data = parse_JSON(XMLHttp);
					if (!data)
						return;
					work_data.chapter_list.append(data.ep);
					run_next();
				}, true);

			}, work_data.pager.maxPage, 2, callback);
		});
	},
	get_chapter_list : function(work_data, html, get_label) {
		work_data.chapter_list.forEach(function(chapter_data) {
			chapter_data.title = chapter_data.subtitle || work_data.title;
			chapter_data.url = this.work_URL(work_data.id) + '/'
					+ chapter_data.episode_no;
		}, this);

		// 因為中間的章節可能已經被下架，因此依章節標題來定章節編號。
		this.set_chapter_NO_via_title(work_data);
		// console.log(work_data);
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		html = html.between('<div id="main-block">',
				'<div class="main-pager" id="pager">');

		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		chapter_data.image_list = [];
		html.each_between('<div class="img"', '</div>',
		//
		function(text) {
			var url = text.match(/ data-original="([^"]+)"/)
					|| text.match(/ url="([^"]+)"/);
			chapter_data.image_list.push(url[1]);
		});

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
