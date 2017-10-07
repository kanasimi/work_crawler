/**
 * 批量下載卡提諾論壇小說的工具。 Download Catino novels.
 * 
 * TODO: https://ck101.com/forum.php?mod=viewthread&action=printable&tid=2737067
 * 
 * @see http://jdev.tw/blog/4538/ck101-getstory-ebook-for-kindle
 *      https://ck101.com/thread-2642285-1-1.html
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB' ]);

// 解析論壇討論串標題
function parse_topic_title(title, work_data) {
	function parse_genre(genre) {
		genre = genre.replace(/[\[【(（<]([^\[【(（<\]】)）>]+)[\]】)）>]/g,
		//
		function(all, genre) {
			if (/第.+部/.test(genre)) {
				return all;
			}
			work_data.status.push(genre.trim());
			return '';
		}).trim();
		return genre;
	}

	var matched = title.match(/^(.+)作者[:：︰]?(.+)$/);
	if (!matched) {
		if (work_data) {
			throw 'parse_topic_title: 無法解析論壇討論串標題';
		}
		return;
	}

	work_data = work_data || CeL.null_Object();
	work_data.status = [];
	work_data.author = parse_genre(matched[2]);
	if (/\s/.test(work_data.author)) {
		CeL.warn('parse_topic_title: Invalid author? ' + work_data.author);
	}
	// check title. e.g., 小說名稱前有多個分類
	work_data.title = parse_genre(matched[1])
	// e.g., 誰主沉浮
	.replace(/^《(.+?)》$/, '$1').trim();

	// console.log(work_data);
	return work_data;
}

var search_URL = 'https://www.googleapis.com/customsearch/v1element?key=AIzaSyCVAXiUzRYsML1Pv6RwSG1gunmMikTzQqY&rsz=filtered_cse&num=10&hl=zh_TW&prettyPrint=false&source=gcsc&gss=.com&sig=bb73d6800fca299b36665ebff4d01037&cx=partner-pub-1630767461540427:6206348626&q=',
//
ck101 = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節。
	// 'changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。
	recheck : 'changed',

	base_URL : 'https://ck101.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : search_URL,
	parse_search_result : function(data, get_label, work_title) {
		data = JSON.parse(data);
		// console.log(data);
		var id_data;
		if (data.results.some(function(result) {
			var matched = result.url
			// [ file name, tid ]
			.match(/\/thread-(\d{1,8})-\d{1,4}(?:-\d{1,2})?.html?$/);
			if (matched) {
				var work_data = parse_topic_title(
				//
				get_label(result.titleNoFormatting || result.title));
				if (work_data.title.trim() === work_title.trim()) {
					id_data = CeL.null_Object();
					id_data[matched[1]] = work_title;
					return true;
				}
			}
		})) {
			return id_data;
		}
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'thread-' + work_id + '-1-1.html';
	},
	parse_work_data : function(html, get_label) {
		var raw_data = JSON.parse(html.between(
				'<script type="application/ld+json">', '</script>')),
		//
		mainEntity = raw_data["@graph"][0].mainEntity,
		//
		work_data = {
			last_update : mainEntity.dateModified,
			description : get_label(mainEntity.description),
			chapter_count : mainEntity.pageEnd,
			book_chapter_count : 0,
			site_name : '卡提諾論壇',

			raw : raw_data
		};

		parse_topic_title(get_label(mainEntity.name), work_data);

		return work_data;
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter) {
		// https://ck101.com/forum.php?mod=viewthread&tid=1848378&page=87
		return 'thread-' + work_data.id + '-' + chapter + '-1.html';
	},
	parse_chapter_data : function(html, work_data, get_label, chapter) {
		//
		function book_chapter_is_OK() {
			if (book_chapter && (book_chapter = +book_chapter[1]) >= 1
			// 差距不大時才可算數。
			&& Math.abs(book_chapter - work_data.book_chapter_count) < 4) {
				work_data.book_chapter_count = book_chapter;
				return true;
			}
		}

		var book_chapter, raw_data = JSON.parse(html.between(
				'<script type="application/ld+json">', '</script>')),
		//
		mainEntity = raw_data["@graph"][0].mainEntity,
		// /<div id="(post_\d+)" class="plhin">/g
		PATTERN = /<div id="(post_\d+)"/g,
		//
		matched, matched_list = [];

		html = html.between('<!--postlist-->', '<!--postlist end-->')
		// e.g., ' src="https://ck101.com/static/image/common/none.gif"'
		.replace(/ src="[^"]+?\/(?:none|nophoto|back)\.[a-z]+"/g, '')
		// e.g., https://ck101.com/thread-3277544-1-1.html
		.replace(/<img ([^<>]+)>/g, function(all, attributes) {
			if (/(?:^|\s)src=/.test(attributes)) {
				return all;
			}
			return all.replace(/(?:^|\s)file=/, ' src=');
		});

		if (false) {
			html = html.replace(/<i class="pstatus">/g,
			// 刪除最後發帖者
			'<i class="pstatus" style="display:none;">');
		}

		while (matched = PATTERN.exec(html)) {
			matched_list.push([ matched.index, matched[1] ]);
		}
		matched_list.push([ html.length ]);

		for (var index = 0; index < matched_list.length - 1; index++) {
			var text = html.slice(matched_list[index][0],
					matched_list[index + 1][0]), part_title = null, date = text
					.between(' class="postDateLine">', '</span>');
			if (date) {
				date = date.to_Date();
				// date.replace(/發表於 *:?/, '').trim();
			}

			var rate = text.between('<table class="ratl">', '</table>');

			text = text.between(' class="t_fsz">').between('<table ').between(
					'>', '</table>').replace(/<div class="adBox">[\s\S]*$/, '')
					.replace(/<\/?t[adhr][^<>]*>/g, '').trim();
			text = text.replace(
					/^<(strong|font|b)(?:\s[^<>]*)?>([\s\S]{1,120}?)<\/\1>/,
					function(all, $1, title) {
						part_title = get_label(title);
						return '';
					});

			if (rate) {
				// 納入評分理由。
				text += '<hr /><table>' + rate.replace(/\s*\n\s*/g, '')
				// 去除頭像。
				.replace(/<a [\s\S]+?>([\s\S]+?)<\/a>/g,
				//
				function(all, innerHTML) {
					return innerHTML.includes('<img ') ? '' : innerHTML;
				}) + '</table>';
			}

			// console.log('-'.repeat(80));
			// console.log(text);
			work_data.book_chapter_count++;

			// 嘗試解析章節號碼。
			if (part_title) {
				book_chapter = CeL.from_Chinese_numeral(part_title);
				book_chapter = book_chapter.match(/(\d+) *章/)
				// 先檢查"章"，預防有"第?卷 第?章"。
				|| book_chapter.match(/第 *(\d+)/);
				book_chapter_is_OK();
			} else {
				part_title = text.match(/^[^\n]*/)[0];
				book_chapter = CeL.from_Chinese_numeral(part_title).match(
						/第 *([\d ]+) *章/);
				if (book_chapter_is_OK()) {
					part_title = get_label(part_title);
					text = text.replace(part_title, '');
				} else {
					part_title = '第' + work_data.book_chapter_count + '章';
				}
			}

			this.add_ebook_chapter(work_data, work_data.book_chapter_count, {
				title : part_title,
				text : text,
				url : this.full_URL(this.chapter_URL(work_data, chapter)) + '#'
						+ matched_list[index][1],
				date : date || new Date(mainEntity.dateModified)
			});
		}
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

ck101.start(work_id);
