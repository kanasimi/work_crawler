/**
 * 批量下載卡提諾論壇小說的工具。 Download Catino novels. (novel.cmn-Hant-TW)
 * https://www.facebook.com/ck101fans
 * 
 * TODO: https://ck101.com/forum.php?mod=viewthread&action=printable&tid=2737067
 * 
 * @see http://jdev.tw/blog/4538/ck101-getstory-ebook-for-kindle
 *      https://ck101.com/thread-2642285-1-1.html
 */

'use strict';

require('../work_crawler_loader.js');

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

	work_data = work_data || Object.create(null);
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
		throw 'get_work_data_from_html: Cannot parse page!';
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
// [ all, tid, title, 回覆 ]
PATTERN_search_201802 = /<a href="[^"<>]+?tid=(\d+)[^"<>]*"[^<>]*>([^<>]+)<\/a>[\s\S]+?<p class="xg1">([^<>]+)/g,
// [ all, tid, title, other data ]
PATTERN_search = /<h3 class="xs3">[\s\n]*<a href="[^"<>]+?tid=(\d+)[^"<>]*"[^<>]*>([^<>]+)<\/a>([\s\S]+?)<\/div>/g,
// [ all, forum name ]
PATTERN_forum = /<a href="[^"<>]+?forum\.php?[^"<>]*"[^<>]*>([^<>]+)<\/a>/,

// cf. .trimStart()
PATTERN_START_SPACE = /^(?:[\s\n]+|&nbsp;|<(?:br|hr)[^<>]*>)+/i,
//
PATTERN_START_QUOTE = /<div class="quote"><blockquote>([\s\S]*?)<\/blockquote><\/div>(?:[\s\n]+|&nbsp;|<(?:br|hr)[^<>]*>)*/i,
//
PATTERN_POST_STATUS = /^(<i class="pstatus">.+<\/i>)(?:[\s\n]+|&nbsp;|<(?:br|hr)[^<>]*>)*/i,
// 正規的標題形式。 /g for 凡人修仙之仙界篇
// [ all, tag name, chapter_title, space ]
PATTERN_chapter_title = /^<(strong|font|b|h2)(?:\s[^<>]*)?>([\s\S]{1,120}?)<\/\1>((?:[\s\n]|<br(?:[\s\/][^<>]*)?>)*)/g,
//
crawler = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節。
	// 'changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。
	recheck : 'changed',

	site_name : '卡提諾論壇',
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
				id_data = Object.create(null);
				id_data[matched[1]] = work_title;
				return true;
			}
		})) {
			return id_data;
		}
		// 未找到相符者。
		return [];
	},

	search_URL_201802 : function(work_title) {
		return [ 'search.php?mod=forum', {
			formhash : 'aa2d7d2d',
			srchtxt : work_title,
			searchsubmit : 'yes',
			// 搜尋小說類型
			srchtab : 'novel'
		} ];
	},
	parse_search_result_201802 : function(html, get_label, work_title) {
		html = html.between('<h2>');
		// console.log(html);
		var matched, best_result;
		while (matched = PATTERN_search_201802.exec(html)) {
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

	// 搜尋功能改版: 在 2018/3/25 之前
	search_URL : function(work_title) {
		return [ 'search.php?mod=forum', {
			formhash : 'aa2d7d2d',
			srchtab : 'novel',
			srchtxt : work_title,
			searchsubmit : 'yes'
		} ];
	},
	parse_search_result : function(html, get_label, work_title) {
		// html = html.between('id="threadlist"');
		// console.log(html);
		var matched, id_list = [], id_data = [];
		while (matched = PATTERN_search.exec(html)) {
			// delete matched.input;
			// console.log(matched);
			var work_data = parse_topic_title(get_label(matched[2]));
			if (!work_data) {
				continue;
			}

			var forum = matched[3].match(PATTERN_forum);
			if (forum) {
				forum = get_label(forum[1]);
				work_data.forum = forum;
			}

			// console.log(work_data);
			matched = matched[1];
			// 全篇小說 長篇小說 短篇小說 NG: 小說討論
			if (forum.includes('篇小說')) {
				// 把小說放在第一搜索位置。
				// e.g., 重生之賊行天下
				id_list.unshift(matched);
				id_data.unshift(work_data);
			} else {
				id_list.push(matched);
				id_data.push(work_data);
			}
		}
		return [ id_list, id_data ];
	},
	title_of_search_result : 'title',

	// ----------------------------------------------------

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'thread-' + work_id + '-1-1.html';
		return '/forum.php?mod=viewthread&tid=' + work_id
				+ '&extra=page%3D1&page=1'
	},
	parse_work_data : function(html, get_label, extract_work_data) {
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

			raw : raw_data
		} : Object.create(null);

		parse_topic_title(get_label(mainEntity && mainEntity.headline
		// 2018/2/9 改版
		|| get_label(html.between('<hgroup>', '</hgroup>')
		//
		.replace(/<a href="[^<>"]+" onclick="ga[^<>]+>.+?<\/a>/, '')))
		//
		.replace(/[\s\n]+/g, ' '), need_check_title && work_data);

		var matched = (html.between('<div class="pg">', '</div>') || html)
				.match(/([^<>]+)<\/a>\s*<a [^<>]* class="nxt"/),
		// 2018/2/9 改版: 從 HTML 取得資訊。
		_work_data = {
			last_update : html.between(
					'<meta itemprop="dateModified" content="', '"')
					|| html.between(
					//
					'<meta itemprop="dateCreated" content="', '"'),
			chapter_count : matched ? +matched[1].trim().replace(/^[.\s]+/, '')
					: 1,
			book_chapter_count : 0
		};
		// 由 meta data 取得作品資訊。
		extract_work_data(_work_data, html);
		if (work_data.chapter_count < _work_data.chapter_count) {
			// 有時會出現 mainEntity.pageEnd 比較小的情況。
			work_data.chapter_count = _work_data.chapter_count;
		}
		// 還是以原 work_data 的為重。
		work_data = Object.assign(_work_data, work_data);

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
		// "|| []": e.g., 悟空傳
		work_data.tags = (work_data.status || []).append(tags).unique();
		work_data.status = work_data.tags.filter(function(tag) {
			// 連載中
			return /完本|完結|連載/.test(tag);
		});
		if (work_data.status.length === 0) {
			// 無法判別作品是否完結。
			work_data.status = work_data.tags;
			delete work_data.tags;
		}

		// 去掉預設的廣告圖片 "超過一百分・卡提諾不意外"
		if (work_data.image && work_data.image.includes('ZMZHjmd')) {
			// <meta property="og:image" itemprop="image"
			// content="https://s1.imgs.cc/img/ZMZHjmd.jpg"/>
			delete work_data.image;
		}

		// console.log(work_data);
		// console.log(JSON.stringify(work_data));
		return work_data;
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter_NO) {
		// https://ck101.com/thread-3397649-1-1.html
		return 'thread-' + work_data.id + '-' + chapter_NO + '-1.html';
		// https://ck101.com/forum.php?mod=viewthread&tid=1848378&page=87
		return '/forum.php?mod=viewthread&tid=' + work_data.id
				+ '&extra=page%3D1&page=' + chapter_NO;
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// TODO: book_chapter, work_data, as arguments
		function book_chapter_is_OK(matched, diff) {
			if (false) {
				console.log([ 'book_chapter_is_OK', book_chapter, matched,
						diff, work_data.book_chapter_count ]);
			}
			if (matched === undefined || matched === null)
				matched = book_chapter;
			if (matched && (matched = +matched[1]) > 0
			//
			&& Math.abs(matched - work_data.book_chapter_count)
			// 4: 差距不大時才可算數。
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
		matched, topic_index_list = [];

		// 處理實際頁數與之前得到頁數不同的問題。
		if (raw_data.pagination < chapter_NO
		// 照理 ((raw_data.pagination === chapter_NO))
		&& raw_data.pagination === raw_data.pageEnd) {
			CeL.warn('parse_chapter_data: 預期取得第' + chapter_NO + '頁，但實際得到第'
			//
			+ raw_data.pagination + '/' + raw_data.pageEnd + '頁，跳過本頁。');
			return;
		}

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
				&& !url.startsWith('/')) {
					url = _this.base_URL + url;
				} else if (url.includes('bookcover.yuewen')) {
					// e.g.,
					// "https://bookcover.yuewen.com/qdbimg/349573/1015476631/180"
					// @see qidian.js
					url = url.trim()
					// 用比較大的圖。
					// 90 @ https://www.qidian.com/
					// 180 @ https://book.qidian.com/info/
					// 300 @ https://m.qidian.com//book/
					.replace(/\/(?:180|90|300)$/, '/600');
				}
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
			topic_index_list.push([ matched.index, matched[1] ]);
		}
		topic_index_list.push([ html.length ]);

		if (false) {
			topic_index_list
			// TODO: book_chapter
			.forEach(function(topic_index, index, topic_index_list) {
				for_each_topic.call(this, html, work_data, mainEntity,
						topic_index, index, topic_index_list);
			});
		}

		for (var index = 0; index < topic_index_list.length - 1; index++) {
			var text = html.slice(topic_index_list[index][0],
					topic_index_list[index + 1][0]),
			//
			date = text.between(' class="postDateLine">', '</span>');
			if (date) {
				date = date.to_Date();
				// date.replace(/發表於 *:?/, '').trim();
			} else if (text.includes('<div class="locked">')) {
				// e.g., "<div class="locked">提示: <em>該帖被管理員或版主屏蔽</em></div>"
				continue;
			}

			// 評分。
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
			// @see function set_chapter_NO_via_title()
			// TODO: https://ck101.com/thread-2995922-90-1.html#post_99817050
			// <font color="#01579B">第896章放棄還是投降？<strong></strong></font><br />

			if (matched) {
				// add <h2>...</h2>
				text = matched[0].trimStart() + text;
			}

			var chapter_title = [], first_line, _chapter_title;

			text = text.replace_till_stable(PATTERN_chapter_title, function(
					all, tag_name, _chapter_title, space) {
				first_line = all;
				chapter_title.push(get_label(_chapter_title), space ? space
						.includes('\n')
						|| space.includes('<br') ? '\n' : ' ' : '');
				return '';
			});
			// console.log(chapter_title);
			// console.log(text);
			chapter_title = chapter_title.join('');

			if (chapter_title) {
				text = text
				// for: https://ck101.com/thread-2676074-58-1.html#post_91016623
				// <font size="4"><font color="RoyalBlue">...</font></font>
				// <br />
				.replace(/^(?:<\/[a-z]+>)+/, function(all) {
					// 預防回復的時候丟失東西。
					first_line += all;
					return '';
				})
				// trimStart
				.replace(PATTERN_START_SPACE, function(all) {
					first_line += all;
					return '';
				});
			} else {
				// 取第一行。
				first_line = text.match(/^[^\n]*/)[0];
				_chapter_title = get_label(first_line) || '';
			}

			// assert: 所有 text 起頭的空白皆已被消除。
			// TODO: 補上段落起頭的空白。

			book_chapter = CeL.from_Chinese_numeral(
					chapter_title || _chapter_title).toString();

			var matched = book_chapter
			// 第一部 聖詠之城卷 第二十八章
			.match(/(?:^|[\n第]) {0,2}(\d{1,2}) {0,2}[卷篇集](?:[^完]|$)/)
			// e.g., 永夜君王, 特拉福買家俱樂部
			|| book_chapter.match(/(?:^|[\n\s《])卷(\d{1,2})(?:[\s》]|第\d|$)/),
			// e.g., 雪鷹領主, 凡人修仙傳
			has_part_title = matched && +matched[1] > 0;

			// TODO: 序章
			matched = book_chapter
			// (?:\.\d+): 劍靈同居日記 第73.5章
			// 唐磚 第一卷 \n 第一節
			.match(/(?:^|[\n第]) {0,2}(\d{1,4}(?:\.\d+)?) {0,2}[章節]/);
			// console.log([ 'before check', has_part_title, matched ]);

			if (matched
			// 當格式明確的時候，可以容許比較大的跨度。
			&& book_chapter_is_OK(matched, has_part_title ? 450 : 250)
			// ↑ 250: 劍靈同居日記, 450: 一世之尊
			|| chapter_title
			//
			&& book_chapter_is_OK(book_chapter.match(/(\d+) *[章節]/)
			// 先檢查"章"，預防有"第?卷 第?章"。
			|| book_chapter.match(/第 *(\d{1,2})(?:[^卷篇集]|$)/)
			// e.g., 永夜君王
			|| book_chapter.match(/(?:^|[\n\s《])[章節](\d{1,4})(?:[\s》]|$)/),
			//
			has_part_title ? 40 : 4)
			//
			|| book_chapter_is_OK(
			// e.g., 史上最強師兄 "1836.無盡之道（大結局！）"
			// "280 燕趙歌的三句話"
			book_chapter.match(/(?:^|[^\d])(\d{1,4})[章節. ]/)
			//
			|| book_chapter.match(/(?:^|[\n第]) *(\d{1,2})(?:$|[^卷篇集\d])/))) {
				// CeL.log('有章節標題: ' + chapter_title + '\n ' + _chapter_title);
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
				// e.g., "《奧術神座》正文 第六章 ..."
				// "奧術神座·正文 第時八十一章 時間飛逝"
				.replace(/《\s*》/g, '')
				// e.g., 《奧術神座》番外：【第一章】異世界的來客（上）
				.replace(/^[\s·]*(?:正文)?[:：\s]*/, '').trim();

			} else {
				if (chapter_title) {
					// CeL.log('無法從第一行抽取出章節標題。回補第一行: ' + first_line);
					text = first_line + text;
				}
				// 對一些無法辨識的標題，在這邊如此設定可能會與之前的章節重複，使得後面的章節直接消失。不過這通常是因為原先的章節安排就有錯誤了。
				// e.g., "第一部 聖詠之城卷 第二十八章 條件" & "第一部 聖詠之城卷 第二十八章 測試（新年快樂）"
				//
				// 增加 MAX_ID_LENGTH @ encode_file_name()
				// @ CeL.application.storage.EPUB 有時可以解決問題，卻非治本之道。
				//
				// 經由在 normalize_item() @ CeL.application.storage.EPUB
				// 增加檢測，問題已經解決。
				chapter_title = '第' + work_data.book_chapter_count
						+ (work_data.chapter_unit || this.chapter_unit);
			}

			// CeL.log('chapter_title: ' + chapter_title);

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
			text = text.trim();

			if (this.latest_chapter_title === chapter_title
			// && this.latest_chapter_hash === topic_index_list[index][1]
			&& this.latest_chapter_text === text) {
				CeL.log('偵測到重複章節，將跳過: ' + chapter_title);
				continue;
			}
			this.latest_chapter_title = chapter_title;
			// this.latest_chapter_hash = topic_index_list[index][1];
			this.latest_chapter_text = text;

			this.add_ebook_chapter(work_data, work_data.book_chapter_count, {
				title : chapter_title,
				text : text,
				url : this.full_URL(this.chapter_URL(work_data, chapter_NO))
						+ '#' + topic_index_list[index][1],
				date : date || new Date(mainEntity.dateModified)
			});
		}
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
