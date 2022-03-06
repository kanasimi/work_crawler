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
		// TODO: 2021/10: 似乎會自動把 HTTP/1 轉成手機版網頁。
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
			url : 'free/',
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
			authorId : html.between(' data-authorid="', '"'),
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
		// console.trace(this.get_URL_options.agent);
		this._csrfToken = this.get_URL_options
		//
		.agent.last_cookie.cookie_hash._csrfToken;
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
				var url;
				if (volume.vS) {
					// 2020/10
					url = 'https://vipreader.qidian.com/chapter/'
							+ work_data.id + '/' + chapter_data.id;
					url = 'https://vipreader.qidian.com'
					// 2020/11/11-
					+ '/ajax/chapter/chapterInfo?_csrfToken='
							+ crawler._csrfToken + '&bookId=' + work_data.id
							+ '&chapterId=' + chapter_data.id + '&authorId='
							+ work_data.authorId;
				} else {
					url = 'https://read.qidian.com/chapter/' + chapter_data.cU;
				}
				Object.assign(chapter_data, {
					part_title : volume.vN,
					title : chapter_data.cN,
					url : url,
					limited : !chapter_data.sS
				});
			});
			work_data.chapter_list.append(volume.cs);
		});
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// 在取得小說章節內容的時候，若發現有章節被目錄漏掉，則將之補上。
		// this.check_next_chapter(work_data, chapter_NO, html);

		var chapter_data = work_data.chapter_list[chapter_NO - 1];

		if (/^\s*{/.test(html)) {
			// console.log(html);
			// 2020/11/11- 因為採用了 font 編碼，內文必須先經過 mapping。
			html = JSON.parse(html).data.chapterInfo;
			this.add_ebook_chapter(work_data, chapter_NO, {
				title : html.extra.volumeName || chapter_data.part_title,
				sub_title : html.chapterName || chapter_data.title,
				date : chapter_data.uT || html.updateTime,
				// word count
				wc : chapter_data.cnt || html.wordsCount,
				text : fix_HTML_error(html.content)
						+ fix_HTML_error(html.authorWords.content)
			});
			return;
		}

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
			text : fix_HTML_error(html
			// <div class="read-content j_readContent" id="">
			.between(' class="read-content', '</div>').between('>').trim())
		});
	}
});

// --------------------------

// 修正本網站的 HTML 語法錯誤。
function fix_HTML_error(html) {
	if (!html)
		return '';
	html = html.replace(/<p>$/, '').replace(/(?!^)<p>(?!$)/g, '</p>\n<p>')
	// 修正圖形沒有解析的錯誤。 e.g.,
	// https://read.qidian.com/chapter/T050C_JEojo1/7S-LnenB5z8ex0RJOkJclQ2
	.replace(/\[\[\[CP.*?\|U:([^\|\[\]]+).*?\]\]\]/g, '<img src="$1" />');

	if (false) {
		// 經 font viewer online: https://fontdrop.info/
		// https://www.glyphrstudio.com/online/
		// https://devstudioonline.com/ttf-font-viewer
		// 分析 /ajax/chapter/chapterInfo 中所指示的
		// http://yuewen-skythunder-1252317822.cos.ap-shanghai.myqcloud.com/font/shs-ms-a47a8681.ttf
		// 起点中文网 此字型佔用 \uE290-\uE3DE 各-己, contains 335 glyphs
		//
		// 起点中文网 VIP章節現在採用亂數選擇字型的方式來顯示文字，
		// 每次展示頁面會加載不同字型，因此解析特定字型檔無效，
		// 恐怕需要解析字型數據本身，從 glyphs 數據判斷對應哪個字，再作 mapping。
		// 或可參考 https://github.com/foliojs/fontkit
		// https://github.com/trevordixon/ttfinfo
		// https://github.com/fontello/svg2ttf
		// https://github.com/aui/font-spider
		// https://github.com/kekee000/fonteditor-core/tree/master/src/ttf
		// https://github.com/fontello/ttf2woff/blob/master/index.js
		html = html.replace(/&#(58\d{3});/g, function(entity, code) {
			if (+code in char_mapping)
				return char_mapping[+code];
			return entity;
		});
	}

	return html + '</p>';
}

var char_mapping = [];

function initialize_char_mapping() {
	var char_mapping_data = {
		// Only works for shs-ms-a47a8681.ttf
		E290 : '各手须光同上每置共中省色土或除支再大取只高住京例到最般前家任革次得法又百划教子影代放改几身受机叫水提江多表何持及种于族究治路起看老一志采五流消引收品日石且准院西第式特的信率照活始部之知越律加列去市年用地人器至北等能基确被海技拉反美后利方所象比六思价保事油度公往因原易由素生是真通那些管然千气花二商强片速适很小音干型你查其什程十酸常局者接历七和具精力制类口意府候在他据建八青示界半团安性角而主行才包整天么造位正林育外我向她入成眼明世即自出形米空打系不新面体走想相本存厂好低命太根理以解南别四金指物平都题完证先有化目需格使研分效月便派作道近周科更重直快就元深火斯白按步清山回定工量合算个了感非也毛把件政但情要发果委民斗做并史它下克交此王名段容立料布期值今文社三心九复集求展己'
	};

	for ( var start_code in char_mapping_data) {
		var char_list = char_mapping_data[start_code].chars();
		var index = 0, char_code = parseInt(start_code, 16);
		while (index < char_list.length) {
			char_mapping[char_code++] = char_list[index++];
		}
	}
}

// initialize_char_mapping();

// ----------------------------------------------------------------------------

// CeL.set_debug(6);

start_crawler(crawler, typeof module === 'object' && module);
