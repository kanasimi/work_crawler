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
		genre = genre.replace(/[\[【(（<「〈]([^\[【(（<「〈\]】)）>」〉]+?)[\]】)）>」〉]/g,
		//
		function(all, genre) {
			if (/第.+部/.test(genre)) {
				return all;
			}
			work_data.status.push(genre.trim());
			return '';
		})
		// e.g., 淫術煉金士
		.replace(/(?:18|十八)禁/g, function(genre) {
			work_data.status.push(genre.trim());
			return '';
		}).trim();

		return genre;
	}

	var matched = title.match(/^(.+)作者 *[:：︰]?(.+)$/), need_check = !!work_data;
	if (!matched) {
		if (need_check) {
			throw 'parse_topic_title: 無法解析論壇討論串標題';
		}
		return;
	}

	work_data = work_data || CeL.null_Object();
	work_data.status = [];
	work_data.author = parse_genre(matched[2]);
	if (need_check && /\s/.test(work_data.author)) {
		CeL.warn('parse_topic_title: Invalid author? ' + work_data.author);
	}
	// check title. e.g., 小說名稱前有多個分類
	work_data.title = parse_genre(matched[1])
	// e.g., 誰主沉浮
	.replace(/^《(.+?)》$/, '$1').trim();

	if (!work_data.title) {
		// 當標題一點東西是都不剩下的時候，就把最後一個符合的拿來當標題。
		// e.g., 罪惡之城
		work_data.title = work_data.status.pop();
	}

	// console.log(work_data);
	return work_data;
}

function get_work_data_from_html(html) {
	// 2017/12/19 改版
	html = html.all_between('<script type="application/ld+json">', '</script>')
			.filter(function(slice) {
				return slice.includes('mainEntityOfPage');
			});
	if (html.length !== 1) {
		console.log(html);
		throw 'Can not parse page!';
	}

	html = html[0].replace(/"(?:[^"]*|\\")*"/g, function(quoted) {
		// console.log(quoted);
		return quoted.replace(/\r?\n/g, '\\n');
	})
	// e.g., 異常生物見聞錄
	.replace(/\t/g, '\\t')
	// e.g., 不死不滅 thread-2332198-1-1.html
	.replace(/("(?:pageEnd|pagination)": ),/g, '$1 1,');
	try {
		html = JSON.parse(html);
	} catch (e) {
		console.log('Invalid JSON:\n' + JSON.stringify(html));
		// TODO: handle exception
		return;
	}
	return html;
}

var search_URL = 'https://www.googleapis.com/customsearch/v1element?key=AIzaSyCVAXiUzRYsML1Pv6RwSG1gunmMikTzQqY&rsz=filtered_cse&num=10&hl=zh_TW&prettyPrint=false&source=gcsc&gss=.com&sig=ebaa7a3b8b3fa3d882a727859972d6ad&cx=partner-pub-1630767461540427:6206348626&cse_tok=APbAYefCarQOywugS7Jt3z-nchF-9_ZrLQ:1512555592025&sort=&googlehost=www.google.com&q=',
// cf. .trimStart()
PATTERN_START_SPACE = /^(?:[\s\n]+|&nbsp;|<(?:br|hr)[^<>]*>)+/i,
//
PATTERN_START_QUOTE = /<div class="quote"><blockquote>([\s\S]*?)<\/blockquote><\/div>(?:[\s\n]+|&nbsp;|<(?:br|hr)[^<>]*>)*/i,
//
PATTERN_POST_STATUS = /^(<i class="pstatus">.+<\/i>)(?:[\s\n]+|&nbsp;|<(?:br|hr)[^<>]*>)*/i,
//
crawler = new CeL.work_crawler({
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
			// console.log(result);
			var matched = result.url
			// [ file name, tid ]
			.match(/\/thread-(\d{1,8})-\d{1,4}(?:-\d{1,2})?.html?$/);
			if (!matched) {
				return;
			}

			var title = result.titleNoFormatting || result.title;
			if (/txt|pdf|epub|zip|rar|7z/i.test(title)) {
				return;
			}

			var work_data = parse_topic_title(get_label(title));
			// console.log([ work_title, work_data ]);
			if (work_data && work_data.title.trim() === work_title.trim()) {
				id_data = CeL.null_Object();
				id_data[matched[1]] = work_title;
				return true;
			}
		})) {
			return id_data;
		}
		// 未找到相符者。
		return [];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'thread-' + work_id + '-1-1.html';
	},
	parse_work_data : function(html, get_label) {
		var error = html.between('<div id="messagetext" class="alert_error">',
				'</div>')
		if (error) {
			CeL.error(get_label(error.between(null, '<script')));
		}

		var raw_data = get_work_data_from_html(html),
		//
		mainEntity = raw_data,
		//
		work_data = {
			title : mainEntity.name,
			author : mainEntity.author.name,
			last_update : mainEntity.dateModified,
			description : get_label(mainEntity.description),
			chapter_count : mainEntity.pageEnd,
			book_chapter_count : 0,
			site_name : '卡提諾論壇',

			raw : raw_data
		};

		parse_topic_title(get_label(mainEntity.headline), work_data);

		return work_data;
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter) {
		// https://ck101.com/forum.php?mod=viewthread&tid=1848378&page=87
		return 'thread-' + work_data.id + '-' + chapter + '-1.html';
	},
	parse_chapter_data : function(html, work_data, get_label, chapter) {
		//
		function book_chapter_is_OK(matched, diff) {
			if (matched === undefined)
				matched = book_chapter;
			if (matched && (matched = +matched[1]) >= 1
			// 4: 差距不大時才可算數。
			&& Math.abs(matched - work_data.book_chapter_count)
			//
			< (diff || 4)) {
				work_data.book_chapter_count = matched;
				return true;
			}
		}

		var _this = this, book_chapter,
		//
		raw_data = get_work_data_from_html(html),
		//
		mainEntity = raw_data,
		// /<div id="(post_\d+)" class="plhin">/g
		PATTERN = /<div id="(post_\d+)"/g,
		//
		matched, matched_list = [];

		html = html.between('<!--postlist-->', '<!--postlist end-->')
		// e.g., ' src="https://ck101.com/static/image/common/none.gif"'
		.replace(/ src="[^"]+?\/(?:none|nophoto|back)\.[a-z]+"/g, '')
		// e.g.,
		// https://ck101.com/thread-3397649-147-1.html#post_108084487
		.replace(/<a href="[^"<>]*email-protection"[^<>]*>.*?<\/a>/g, '@')
		// e.g., https://ck101.com/thread-3277544-1-1.html
		.replace(/<img ([^<>]+)>/g, function(all, attributes) {
			if (/(?:^|\s)src=/.test(attributes)) {
				return all;
			}
			return all.replace(/(^|\s)file="([^<>"']+)"/,
			//
			function(all, previous, url) {
				if (!url.startsWith('//') && !url.includes('://')
				//
				&& !url.startsWith('/'))
					url = _this.base_URL + url;
				return previous + 'src="' + url + '"';
			});
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
					matched_list[index + 1][0]), date = text.between(
					' class="postDateLine">', '</span>');
			if (date) {
				date = date.to_Date();
				// date.replace(/發表於 *:?/, '').trim();
			}

			var rate = text.between('<table class="ratl">', '</table>');

			text = text.between(' class="t_fsz">').between('<table ').between(
					'>', '</table>').replace(/<div class="adBox">[\s\S]*$/, '')
					.replace(/<\/?t[adhr][^<>]*>/g, '');

			// trim
			text = text.trimEnd().replace(PATTERN_START_SPACE, '');

			var post_status, blockquote;
			text = text.replace(PATTERN_POST_STATUS, function(all, pstatus) {
				post_status = pstatus;
				return '';
			})
			// 去掉引述。
			.replace(PATTERN_START_QUOTE, function(all, quote) {
				blockquote = quote.trim();
				return '';
			});

			// console.log('-'.repeat(80));
			// console.log(text);
			work_data.book_chapter_count++;

			// ----------------------------------
			// 嘗試解析章節號碼與章節標題。

			var part_title = undefined, first_line, _part_title;

			text = text.replace(
			// 正規的標題形式。
			/^<(strong|font|b)(?:\s[^<>]*)?>([\s\S]{1,120}?)<\/\1>/,
			//
			function(all, tag_attributes, title) {
				first_line = all;
				part_title = get_label(title);
				return '';
			});

			if (!part_title) {
				// 取第一行。
				first_line = text.match(/^[^\n]*/)[0];
				_part_title = get_label(first_line) || '';
			}

			book_chapter = CeL.from_Chinese_numeral(part_title || _part_title)
					.toString();

			var matched = book_chapter.match(/(?:第 *|^) {0,2}(\d+) {0,2}章/);
			if (book_chapter_is_OK(matched, 40)
			// ↑ 40: 當格式明確的時候，可以容許比較大的跨度。
			|| part_title && book_chapter_is_OK(book_chapter.match(/(\d+) *章/)
			// 先檢查"章"，預防有"第?卷 第?章"。
			|| book_chapter.match(/第 *(\d+)/))
			//
			|| book_chapter_is_OK(book_chapter.match(/(?:^|[^\d])(\d{1,4})章/)
			//
			|| book_chapter.match(/(?:第 *|^)(\d{1,4})(?:$|[^\d])/))) {
				if (!part_title) {
					// assert: !!part_title===false
					// && !!first_line===true && !!_part_title===true
					part_title = _part_title;

					// 去除章節標題: 第1行為章節標題。既然可以從第一行抽取出章節標題，那麼就應該要把這一行去掉。
					text = text.replace(first_line, '').replace(
							PATTERN_START_SPACE, '');
				}
				part_title = part_title
				// 去除過多的空白字元。
				.replace(/(\s){2,}/g, '$1')
				// 去除書名: 有時第一行會包含書名。
				.replace(work_data.title, '')
				// e.g., 完美世界
				.replace(/^\s*正文/, '').trim();

			} else {
				if (part_title) {
					// 無法從第一行抽取出章節標題。回補第一行。
					text = first_line + text;
				}
				part_title = '第' + work_data.book_chapter_count + '章';
			}

			// ----------------------------------

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

			if (blockquote) {
				text = '<blockquote>' + blockquote + '</blockquote>\n' + text;
			}
			if (post_status) {
				// recover post status
				text = post_status + '<br />\n' + text;
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

start_crawler(crawler, typeof module === 'object' && module);
