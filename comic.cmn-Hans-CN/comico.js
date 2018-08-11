/**
 * 批量下載 comico (NHN Taiwan Corp.) 的工具。 Download comico comics.
 * (comic.cmn-Hant-TW)
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// one_by_one : true,
	base_URL : 'http://www.comico.com.tw/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'webonly/search/index.nhn?searchWord=',
	parse_search_result : function(html, get_label) {
		html = html.between(' id="officialList">', '</ul>');
		var id_list = [], id_data = [];
		html.each_between('<li class="list-article02__item">', '</li>',
		//
		function(token) {
			// console.log(token);
			var matched = token.match(
			//
			/<a href="[^<>"]*?\/(\d+)\/"[^<>]*? title="([^<>"]+)"/);
			id_list.push(matched[1]);
			id_data.push(get_label(matched[2]));
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
			title : get_label(html.between('<h1', '</h1>').between('>'))
		// 選擇性屬性：須配合網站平台更改。

		}, matched, PATTERN_info =
		//
		/<p class="[^<>"]+?__(author|(?:sub-)?description)">([\s\S]+?)<\/p>/g;

		extract_work_data(work_data, html);

		Object.assign(work_data, JSON.parse(html.between(
				'<script type="application/ld+json">', '</script>')));

		while (matched = PATTERN_info.exec(html)) {
			work_data[matched[1]] = get_label(matched[2]);
		}

		matched = html.match(
		//		
		/<div class="[^<>"]+?__(meta)">([\s\S]+?)<\/div>/);
		if (matched) {
			work_data[matched[1]] = get_label(matched[2]).replace(/\t/g, '');
		}

		return work_data;
	},
	chapter_list_URL : function(work_id, work_data) {
		return [ 'api/getArticleList.nhn', {
			titleNo : work_id
		} ];
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = JSON.parse(html).result;
		html.list.forEach(function(chapter_data) {
			chapter_data.url = chapter_data.articleDetailUrl;
		});
		work_data.chapter_list = html.list;
		delete html.list;
		Object.assign(work_data, html);
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// http://static.comico.com.tw/tw/syn/spn/js/manga/article/plusMangaDetailApp/app.1.12.0.js
		var chapter_data = work_data.chapter_list[chapter_NO - 1], cmnData;
		eval('cmnData=' + html.between('var cmnData =', '</script>'));
		var first_image_url = html.between(' _comicImage">', '</div>').between(
				'src="', '"');
		if (!first_image_url) {
			first_image_url = html.between(
					'<div class="locked-episode__kv _lockedEpisodeKv"',
					'</div>').between("url('", "'");
			chapter_data.limited = true;
		}
		cmnData.imageData.unshift(first_image_url);

		Object.assign(chapter_data, JSON.parse(html.between(
				'<script type="application/ld+json">', '</script>')), {
			// 設定必要的屬性。
			title : get_label(html.between('<title>', '</title>')),
			image_count : html.between('<total>', '</total>') | 0,
			image_list : []
		}, cmnData);

		chapter_data.image_list = chapter_data.imageData.map(function(url) {
			return {
				url : url
			};
		});

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

// for 年齡確認您是否已滿18歲？
crawler.get_URL_options.cookie = 'islt18age=' + Date.now();

if (!crawler.password) {
	start_crawler(crawler, typeof module === 'object' && module);

} else {
	CeL.get_URL('https://id.comico.com.tw/login/login.nhn', function(XMLHttp) {
		// start_crawler(crawler, typeof module === 'object' && module);

		// console.log(crawler.get_URL_options);
		CeL.get_URL('http://www.comico.com.tw/2286/', function(XMLHttp) {
			console.log(XMLHttp);
			console.log(XMLHttp.responseText);
		}, crawler.charset, null, crawler.get_URL_options);

	}, crawler.charset, {
		autoLoginChk : 'Y',
		loginid : crawler.loginid,
		password : crawler.password,
		nexturl : ''
	}, crawler.get_URL_options);
}
