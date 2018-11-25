/**
 * 批量下載 乙女漫画 的工具。 Download nokiacn.net comics.
 * 
 * modify from 9mdm.js→dagu.js, mh160.js
 * 
 * @see qTcms 晴天漫画程序 晴天漫画系统 http://manhua.qingtiancms.com/
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// {Natural}最小容許圖案檔案大小 (bytes)。
	MIN_LENGTH : 500,

	// one_by_one : true,
	base_URL : 'http://www.nokiacn.net/',
	// fs.readdirSync('.').forEach(function(d){if(/^\d+\s/.test(d))fs.renameSync(d,'manhua-'+d);})
	// fs.readdirSync('.').forEach(function(d){if(/^manhua-/.test(d))fs.renameSync(d,d.replace(/^manhua-/,''));})
	// 所有作品都使用這種作品類別前綴。
	// use_work_id_prefix : 'manhua',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'statics/search.aspx?key=',
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

	parse_chapter_data : function(html, work_data) {
		// modify from mh160.js

		var chapter_data = html.between('qTcms_S_m_murl_e="', '"');
		if (chapter_data) {
			// 對於非utf-8編碼之中文，不能使用 atob()???
			chapter_data = atob(chapter_data).split("$qingtiandy$");
		}
		if (!chapter_data) {
			CeL.log('無法解析資料！');
			return;
		}
		// console.log(JSON.stringify(chapter_data));
		// console.log(chapter_data.length);
		// CeL.set_debug(6);

		// 設定必要的屬性。
		chapter_data = {
			image_list : chapter_data.map(function(url) {
				url = encodeURI(url);
				// f_qTcms_Pic_curUrl() → f_qTcms_Pic_curUrl_realpic(v) @
				// http://www.nokiacn.net/template/skin2/css/d7s/js/show.20170501.js?20180805095630
				if (url.startsWith('/')) {
					url = 'http://n.aiwenwo.net:55888' + url;
				} else if (html.between('qTcms_Pic_m_if="', '"') !== '2') {
					// e.g., http://www.nokiacn.net/lianai/caozuo100/134257.html
					url.replace(/\?/gi, "a1a1").replace(/&/gi, "b1b1").replace(
							/%/gi, "c1c1");
					url = (html.between('qTcms_m_indexurl="', '"') || '/')
							+ "statics/pic/?p="
							+ encodeURIComponent(url)
							+ "&picid="
							+ html.between('qTcms_S_m_id="', '"')
							+ "&m_httpurl="
							+ encodeURIComponent(atob(html.between(
									'qTcms_S_m_mhttpurl="', '"')));
				}
				return {
					url : url
				};
			}, this)
		};
		// console.log(JSON.stringify(chapter_data));

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
