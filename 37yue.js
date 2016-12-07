/**
 * 批量下載三七阅读的工具。 Download 37yue comics.
 */

'use strict';

require('./comic loder.js');

// ----------------------------------------------------------------------------

var _37yue = new CeL.comic.site({
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,
	// one_by_one : true,
	base_URL : 'http://www.37yue.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'getjson.shtml?q=',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return this.base_URL + 'manhua/' + work_id + '/';
	},
	parse_work_data : function(html, get_label) {
		var matched, work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1 class="title">', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			description : get_label(html.between('<div class="summary">')
					.between('<div class="bd">', '</div>'))

		}, data = html.between('<div class="info">', '</div>'),
		//
		PATTERN_work_data = /<dt>([^<>]+)<\/dt>[\s\n]*<dd>([^<>]+)<\/dd>/g;
		while (matched = PATTERN_work_data.exec(data)) {
			work_data[matched[1].replace(/[:：]$/, '')] = get_label(matched[2]);
		}
		return work_data;
	},
	get_chapter_count : function(work_data, html) {
		work_data.chapter_list = [];
		var matched,
		/**
		 * e.g., <code>
		<li><a href="1110267.html" title="149+150">149+150</a></li>
		</code>
		 */
		PATTERN_chapter =
		// [all,href,title,inner]
		/<li><a href="([^"<>]+)" title="([^"<>]+)"[^<>]*>(.+?)<\/a><\/li>/g;
		html = html.between('list-chapter', '</ul>')
		while (matched = PATTERN_chapter.exec(html)) {
			work_data.chapter_list.push({
				url : matched[1],
				title : matched[2].trim()
			});
		}
		work_data.chapter_count = work_data.chapter_list.length;
		if (work_data.chapter_count > 1) {
			// 轉成由舊至新之順序。
			work_data.chapter_list = work_data.chapter_list.reverse();
		}
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter) {
		return this.work_URL(work_data.id)
				+ work_data.chapter_list[chapter - 1].url;
	},
	parse_chapter_data : function(html, work_data, get_label) {
		// decode chapter data
		function decode(code) {
			return eval('code=' + code);
		}

		var chapter_data = html.between('var mh_info=', '</script>').trim()
				.replace(/;$/, '');
		if (!chapter_data || !(chapter_data = decode(chapter_data))) {
			return;
		}

		// 設定必要的屬性。
		chapter_data.title = chapter_data.pagename;
		chapter_data.image_count = chapter_data.totalimg;
		chapter_data.image_list = chapter_data.imglist.split('$$')
		//
		.map(function(url) {
			return {
				url : url
			}
		});

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

_37yue.start(work_id);
