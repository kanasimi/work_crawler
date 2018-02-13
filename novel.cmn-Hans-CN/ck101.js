/**
 * 批量下載卡提諾論壇小說的工具。 Download Catino novels. https://www.facebook.com/ck101fans
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

// 解析論壇討論串標題。
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
		// e.g., 飄邈之旅,
		.replace(/《(全文完?)》/g, function(all, genre) {
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

	var need_check_title = !!work_data,
	// 防止如"新聞工作者"
	matched = title.match(/^(.*[^工寫製制勞合協動運操炒名習振大小不表轉亂傑舊之拙耕])作者 *[:：︰]?(.+)$/);
	if (!matched) {
		if (need_check_title) {
			throw 'parse_topic_title: 無法解析論壇討論串標題: [' + title + ']';
		}
		return;
	}

	work_data = work_data || CeL.null_Object();
	work_data.status = [];
	var _author = parse_genre(matched[2]);
	if (!work_data.author) {
		work_data.author = _author;
		if (need_check_title && /\s/.test(work_data.author)) {
			CeL.warn('parse_topic_title: Invalid author? ' + work_data.author);
		}
	} else if (_author && !_author.includes(work_data.author)) {
		CeL.warn('從網頁資訊取得的作者名稱是[' + work_data.author + ']，但是從網頁標題取得的作者名稱是['
				+ _author + ']，兩者不同！');
	}

	// check title. e.g., 小說名稱前有多個分類
	work_data.title = parse_genre(matched[1])
	// e.g., 召喚聖劍
	.replace(/ +小說$/, '')
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

function get_work_data_from_html(html, get_label) {
	// 2017/12/19 改版
	var data = html.all_between('<script type="application/ld+json">',
			'</script>').filter(function(slice) {
		return slice.includes('mainEntityOfPage');
	});
	if (data.length !== 1) {
		return;
		// e.g., 已經將此出錯信息詳細記錄, 由此給您帶來的訪問不便我們深感歉意.
		console.log(html);
		throw 'get_work_data_from_html: Can not parse page!';
	}

	data = data[0].replace(/"(?:[^"]*|\\")*"/g, function(quoted) {
		// console.log(quoted);
		return quoted.replace(/\r?\n/g, '\\n');
	})
	// e.g., 異常生物見聞錄
	.replace(/\t/g, '\\t')
	// e.g., 不死不滅 thread-2332198-1-1.html
	.replace(/("(?:pageEnd|pagination)": ),/g, '$1 1,');
	try {
		data = JSON.parse(data);
	} catch (e) {
		console.log('Invalid JSON:\n' + JSON.stringify(data));
		// TODO: handle exception
		return;
	}
	return data;
}

var search_URL = 'https://www.googleapis.com/customsearch/v1element?key=AIzaSyCVAXiUzRYsML1Pv6RwSG1gunmMikTzQqY&rsz=filtered_cse&num=10&hl=zh_TW&prettyPrint=false&source=gcsc&gss=.com&sig=4368fa9a9824ad4f837cbd399d21811d&cx=partner-pub-1630767461540427:6206348626&cse_tok=AOdTmaD-8P-9dqB_ihmfrf2DZk46lkl4rg:1514090169341&sort=&googlehost=www.google.com&q=',
//
PATTERN_search = /<a href="[^"<>]+?tid=(\d+)[^"<>]*"[^<>]*>([^<>]+)<\/a>[\s\S]+?<p class="xg1">([^<>]+)/g,
// cf. .trimStart()
PATTERN_START_SPACE = /^(?:[\s\n]+|&nbsp;|<(?:br|hr)[^<>]*>)+/i,
//
PATTERN_START_QUOTE = /<div class="quote"><blockquote>([\s\S]*?)<\/blockquote><\/div>(?:[\s\n]+|&nbsp;|<(?:br|hr)[^<>]*>)*/i,
//
PATTERN_POST_STATUS = /^(<i class="pstatus">.+<\/i>)(?:[\s\n]+|&nbsp;|<(?:br|hr)[^<>]*>)*/i,
// 正規的標題形式。 /g for 凡人修仙之仙界篇
PATTERN_chapter_title = /^<(strong|font|b|h2)(?:\s[^<>]*)?>([\s\S]{1,120}?)<\/\1>(?:<br\s*\/>|[\s\n]+)*/,
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
	search_URL_2017 : search_URL,
	// parse google search result
	parse_search_result_2017 : function(data, get_label, work_title) {
		data = JSON.parse(data);
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

	search_URL : function(work_title) {
		return [ 'search.php?mod=forum', {
			formhash : 'aa2d7d2d',
			srchtxt : work_title,
			searchsubmit : 'yes'
		} ];
	},
	parse_search_result : function(html, get_label, work_title) {
		html = html.between('<h2>');
		// console.log(html);
		var matched, best_result;
		while (matched = PATTERN_search.exec(html)) {
			// delete matched.input;
			// console.log(matched);
			var work_data = parse_topic_title(get_label(matched[2]));
			if (work_data && work_data.title === work_title) {
				work_data.id = matched[1];
				var point_1 = matched[3].match(/(\d+) 個回覆/),
				// 選擇最多人參與的帖子。
				point_2 = matched[3].match(/(\d+) 次查看/);
				work_data.point = (point_1 ? point_1[1] * 100 : 0)
						+ (point_2 ? +point_2[1] : 0);
				if (!best_result || best_result.point < work_data.point) {
					best_result = work_data;
				}
			}
			// console.log(work_data);
		}
		if (best_result) {
			best_result = [ [ best_result.id ], [ best_result.title ] ];
			// console.log(best_result);
			return best_result;
		}
		return [];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'thread-' + work_id + '-1-1.html';
	},
	parse_work_data : function(html, get_label, exact_work_data) {
		var error = html.between('<div id="messagetext" class="alert_error">',
				'</div>')
		if (error) {
			CeL.error(get_label(error.between(null, '<script')));
		}

		var raw_data = get_work_data_from_html(html, get_label),
		//
		mainEntity = raw_data, need_check_title = true;
		// 處理非小說的情況。
		if (mainEntity && !mainEntity.name) {
			if (mainEntity['@graph']) {
				mainEntity = mainEntity['@graph'][0].mainEntity;
				need_check_title = false;
			}
		}
		var work_data = mainEntity ? {
			title : mainEntity.name,
			author : mainEntity.author.name,
			last_update : mainEntity.dateModified,
			description : get_label(mainEntity.description),
			chapter_count : mainEntity.pageEnd,
			book_chapter_count : 0,
			site_name : '卡提諾論壇',

			raw : raw_data
		} : CeL.null_Object();

		parse_topic_title(get_label(mainEntity && mainEntity.headline
		// 2018/2/9 改版
		|| get_label(html.between('<hgroup>', '</hgroup>')
		//
		.replace(/<a href="[^<>"]+" onclick="ga[^<>]+>.+?<\/a>/, '')))
		//
		.replace(/[\s\n]+/g, ' '), need_check_title && work_data);

		if (!mainEntity) {
			// 2018/2/9 改版: 從 HTML 取得資訊。
			var matched = (html.between('<div class="pg">', '</div>') || html)
					.match(/([^<>]+)<\/a>\s*<a [^<>]* class="nxt"/),
			//
			_work_data = {
				last_update : html.between(
						'<meta itemprop="dateModified" content="', '"')
						|| html.between(
						//
						'<meta itemprop="dateCreated" content="', '"'),
				chapter_count : matched ? +matched[1].trim().replace(/^[.\s]+/,
						'') : 1,
				book_chapter_count : 0
			};
			// 由 meta data 取得作品資訊。
			exact_work_data(_work_data, html);
			// 還是以原 work_data 的為重。
			work_data = Object.assign(_work_data, work_data);
		}

		var tags = [], matched, PATTERN = /<a [^<>]*title="([^<>"]+)"/g;
		while (matched = PATTERN.exec(html.between('<div class="tagBox">',
				'</div>'))) {
			matched = matched[1];
			if (matched !== work_data.title && matched !== work_data.author
			// e.g., 飄邈之旅之歧天路
			&& matched !== '作者') {
				tags.push(matched);
			}
		}
		work_data.status = work_data.status.append(tags).unique();

		// console.log(work_data);
		return work_data;
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter_NO) {
		// https://ck101.com/forum.php?mod=viewthread&tid=1848378&page=87
		// https://ck101.com/thread-3397649-1-1.html
		return 'thread-' + work_data.id + '-' + chapter_NO + '-1.html';
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		//
		function book_chapter_is_OK(matched, diff) {
			if (false) {
				console.log([ 888, book_chapter, matched, diff,
						work_data.book_chapter_count ]);
			}
			if (matched === undefined || matched === null)
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
		raw_data = get_work_data_from_html(html, get_label),
		//
		mainEntity = raw_data,
		// /<div id="(post_\d+)" class="plhin">/g
		PATTERN_chapter = /<div id="(post_\d+)"/g,
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
		})
		// e.g., 師侄, 侄子
		.replace(/佷/g, '侄');

		if (false) {
			html = html.replace(/<i class="pstatus">/g,
			// 刪除最後發帖者
			'<i class="pstatus" style="display:none;">');
		}

		while (matched = PATTERN_chapter.exec(html)) {
			matched_list.push([ matched.index, matched[1] ]);
		}
		matched_list.push([ html.length ]);

		for (var index = 0; index < matched_list.length - 1; index++) {
			var text = html.slice(matched_list[index][0],
					matched_list[index + 1][0]),
			//
			date = text.between(' class="postDateLine">', '</span>');
			if (date) {
				date = date.to_Date();
				// date.replace(/發表於 *:?/, '').trim();
			} else if (text.includes('<div class="locked">')) {
				// e.g., "<div class="locked">提示: <em>該帖被管理員或版主屏蔽</em></div>"
				continue;
			}

			var rate = text.between('<table class="ratl">', '</table>');

			text = text.between(' class="pcb">')
					|| text.between(' class="t_fsz">');
			var matched = text.match(
			// e.g., 凡人修仙傳
			/^\s*<(h2)>([\s\S]{1,150}?)<\/\1>[\r\n]*/);
			text = text.between('<table ').between('>', '</table>').replace(
					/<div class="adBox">[\s\S]*$/, '').replace(
					/<\/?t[adhr][^<>]*>/g, '');

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

			if (matched) {
				// add <h2>...</h2>
				text = matched[0].trimStart() + text;
			}

			var chapter_title = [], first_line, _chapter_title;

			text = text.replace_till_stable(PATTERN_chapter_title, function(
					all, tag_attributes, title) {
				first_line = all;
				chapter_title.push(get_label(title));
				return '';
			});
			// console.log(chapter_title);
			// console.log(text);
			chapter_title = chapter_title.join(' ');

			if (!chapter_title) {
				// 取第一行。
				first_line = text.match(/^[^\n]*/)[0];
				_chapter_title = get_label(first_line) || '';
			}

			book_chapter = CeL.from_Chinese_numeral(
					chapter_title || _chapter_title).toString();

			var matched = book_chapter
			//
			.match(/(?:第|^) {0,2}(\d{1,2}) {0,2}[篇卷](?:[^完]|$)/)
			// e.g., 永夜君王, 特拉福買家俱樂部
			|| book_chapter.match(/(?:[\s《]|^)卷(\d{1,2})(?:[\s》]|第\d|$)/),
			// e.g., 雪鷹領主, 凡人修仙傳
			has_part_title = matched && +matched[1] > 0;

			matched = book_chapter.match(/(?:第|^) {0,2}(\d{1,4}) {0,2}章/);
			// console.log([ 333, has_part_title, matched ]);

			if (matched
			//
			&& book_chapter_is_OK(matched, has_part_title ? 300 : 40)
			// ↑ 300, 40: 當格式明確的時候，可以容許比較大的跨度。
			|| chapter_title
			//
			&& book_chapter_is_OK(book_chapter.match(/(\d+) *章/)
			// 先檢查"章"，預防有"第?卷 第?章"。
			|| book_chapter.match(/第 *(\d{1,2})(?:[^篇卷]|$)/)
			// e.g., 永夜君王
			|| book_chapter.match(/(?:[\s《]|^)章(\d{1,4})(?:[\s》]|$)/),
			//
			has_part_title ? 40 : 4)
			//
			|| book_chapter_is_OK(
			//
			book_chapter.match(/(?:^|[^\d])(\d{1,4})章/)
			//
			|| book_chapter.match(/(?:第|^) *(\d{1,2})(?:$|[^篇卷\d])/))) {
				// console.log([ 1, chapter_title ]);
				if (!chapter_title) {
					// assert: !!chapter_title===false
					// && !!first_line===true && !!_chapter_title===true
					chapter_title = _chapter_title;

					// 去除章節標題: 第1行為章節標題。既然可以從第一行抽取出章節標題，那麼就應該要把這一行去掉。
					text = text.replace(first_line, '').replace(
							PATTERN_START_SPACE, '');
				}
				chapter_title = chapter_title
				// 去除過多的空白字元。
				.replace(/(\s){2,}/g, '$1')
				// 去除書名: 有時第一行會包含書名。
				.replace(work_data.title, '')
				// e.g., 完美世界
				.replace(/^\s*正文/, '').trim();

			} else {
				if (chapter_title) {
					// 無法從第一行抽取出章節標題。回補第一行。
					text = first_line + text;
				}
				chapter_title = '第' + work_data.book_chapter_count + '章';
			}

			// console.log(chapter_title);
			// throw 14564164;

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
				title : chapter_title,
				text : text,
				url : this.full_URL(this.chapter_URL(work_data, chapter_NO))
						+ '#' + matched_list[index][1],
				date : date || new Date(mainEntity.dateModified)
			});
		}
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
