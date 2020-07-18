/**
 * 批量下載 起点中文网(https://www.qidian.com/)的工具。 Download qidian novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// CeL.detect_HTML_language()
, 'application.locale' ]);

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。default:false
	// recheck='changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。否則只會自上次下載過的章節接續下載。
	recheck : 'changed',

	site_name : '起点中文网',
	base_URL : 'https://www.qidian.com/',
	book_base_URL : 'https://book.qidian.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search?kw=',
	parse_search_result : function(html, get_label) {
		html = html.between('<div class="book-img-text">', '</ul>').between(
				'<ul');
		// test: 吞噬星空,百煉成神,不存在作品
		// console.log(html);
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [], text, get_next_between = html.find_between('<h4>',
				'</h4>');

		while ((text = get_next_between()) !== undefined) {
			// 從URL網址中解析出作品id。
			var matched = text.match(
			//
			/<a [^<>]*?href="[^<>"]+?\/(\d+)"[^<>]*>(.+?)<\/a>/);
			id_list.push(matched[1]);
			id_data.push(get_label(matched[2]));
		}

		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},
	convert_id : {
		// 篩出限时免费作品
		free : {
			url : 'free',
			parser : function(html, get_label) {
				html = html.between('limit-book-list', 'right-side-wrap');
				var id_list = [], matched, PATTERN =
				//
				/<h4><a [^<>]+>([^<>]+)<\/a><\/h4>/g;
				while (matched = PATTERN.exec(html)) {
					id_list.push(get_label(matched[1]));
				}
				return id_list;
			}
		}
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return this.book_base_URL + 'info/' + work_id;
	},
	parse_work_data : function(html, get_label) {
		// console.log(html);

		var text = html.between(' class="book-information',
				' class="content-nav-wrap')
				|| html,
		//
		text2 = html.between('<p class="cf">', '</p>'),
		//
		work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(text.between('<h1>', '</em>')),

			// 選擇性屬性：須配合網站平台更改。
			image : text.between(' class="book-img"')
					.between('<img src="', '"').trim()
					// 用比較大的圖。
					// 90 @ https://www.qidian.com/
					// 180 @ https://book.qidian.com/info/
					// 300 @ https://m.qidian.com//book/
					.replace(/\/(?:180|90|300)$/, '/600'),
			author : get_label(text.between(' class="writer"', '</a>').between(
					'>')),
			tags : text.between('<p class="tag">', '</p>').split(
					/<\/(?:span|a)>/).append(
					// 作者自定义标签
					html.between(' class="book-intro"', ' class="update"')
							.between(' class="detail"', '</div>').between('>')
							.split('</a>')).map(
					function(tag) {
						return get_label(tag).replace(/\s+/g, ' ').replace(
								/\s?\n+/g, '\n');
					}).filter(function(tag) {
				return !!tag;
			}).unique(),
			intro : get_label(text.between(' class="intro"', '</p>').between(
					'>')),
			last_update : text2.between('<em class="time">', '</em>'),
			latest_chapter : text2.between(' title="', '"'),
			description : get_label(html.between(' class="book-intro"',
					'</div>').between('>')),
			// 今日限免 限時免費 限时免费 limited time offer, free for a limited time
			// free to download for a limited time
			is_free : html.includes(' class="flag"'),
			author_image : get_label(html.between(' id="authorId"', '</div>')
					.between('<img src="', '"'))
		};

		if (work_data.is_free) {
			work_data.tags.push('限免');
			// 將限免作品移至特殊目錄下。
			work_data.base_directory_name = 'free';
			work_data.directory_name_extension = '.'
					+ (new Date).format('%Y%2m%2d');
		}

		work_data.status = work_data.tags.filter(function(tag) {
			return tag === '连载' || tag === '完本';
		});
		if (work_data.status.length === 0) {
			// 無法判別作品是否完結。
			work_data.status = work_data.tags;
			delete work_data.tags;
		}

		// console.log(work_data);
		return work_data;
	},
	// 對於章節列表與作品資訊分列不同頁面(URL)的情況，應該另外指定.chapter_list_URL。
	chapter_list_URL : function(work_id) {
		this._csrfToken = this.get_URL_options.agent.cookie_hash._csrfToken;
		return this.book_base_URL + 'ajax/book/category?_csrfToken='
				+ this._csrfToken + '&bookId=' + work_id;
	},
	get_chapter_list : function(work_data, html, get_label) {
		// console.log(html);
		var data = JSON.parse(html);
		if (!data.data) {
			// {"code":1006,"msg":"未定义异常"}: 被消失了?
			var error = new Error(data.msg);
			error.code = data.code;
			this.onwarning(error);
			return;
		}

		work_data.chapter_list = [];
		data.data.vs.forEach(function(volume) {
			work_data.last_update = volume.cs[volume.cs.length - 1].uT;
			CeL.debug(volume.vN + ': ' + (volume.vS ? 'VIP卷' : '免费卷'), 2);
			if (volume.vS && !work_data.is_free && volume.cs.length > 10) {
				// 跳過太多的 VIP卷。
				return;
			}
			// chapter section?
			volume.cs.forEach(function(chapter_data) {
				Object.assign(chapter_data, {
					part_title : volume.vN,
					title : chapter_data.cN,
					url : volume.vS ? 'https://vipreader.qidian.com/chapter/'
							+ work_data.id + '/' + chapter_data.id
							: 'https://read.qidian.com/chapter/'
									+ chapter_data.cU,
					limited : !chapter_data.sS
				});
			});
			work_data.chapter_list.append(volume.cs);
		});
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// 在取得小說章節內容的時候，若發現有章節被目錄漏掉，則將之補上。
		this.check_next_chapter(work_data, chapter_NO, html);

		var chapter_data = work_data.chapter_list[chapter_NO - 1];

		this.add_ebook_chapter(work_data, chapter_NO, {
			title : chapter_data.part_title,
			sub_title : get_label(html.between('<h3 class="j_chapterName">',
					'</h3>'))
					|| chapter_data.title,
			date : chapter_data.uT
					|| get_label(html.between('<span class="j_updateTime">',
							'</span>')),
			// word count
			wc : chapter_data.cnt
					|| +get_label(html.between(
							'<span class="j_chapterWordCut">', '</span>')),
			text : html
			//
			.between(' class="read-content', '</div>').between('>').trim()
			// 修正本網站的 HTML 語法錯誤。
			.replace(/<p>$/, '').replace(/(?!^)<p>(?!$)/g, '</p>\n<p>')
			// 修正圖形沒有解析的錯誤。 e.g.,
			// https://read.qidian.com/chapter/T050C_JEojo1/7S-LnenB5z8ex0RJOkJclQ2
			.replace(/\[\[\[CP.*?\|U:([^\|\[\]]+).*?\]\]\]/g,
					'<img src="$1" />')
					+ '</p>'
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(6);

start_crawler(crawler, typeof module === 'object' && module);
