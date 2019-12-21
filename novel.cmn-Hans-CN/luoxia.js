/**
 * 批量下載落霞小说网的工具。 Download luoxia novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// CeL.detect_HTML_language()
, 'application.locale' ]);

// ----------------------------------------------------------------------------

/**
 * <code>
 <h3 id="gcd-1" class="acin"><a  target="_blank" title="第一部 精绝古城" href="http://www.luoxia.com/guichui/gcd-1/">第一部 精绝古城</a></h3>
 <li><a target="_blank" title="引子" href="http://www.luoxia.com/guichui/27426.htm">引子</a></li>
 </code>
 */
// 章節以及篇章連結的模式。
// [ list code, list or title, title, href, title ]
var PATTERN_chapter = /<(li|h3)[^<>]*><a [^<>]*? title="([^"<>]+)" href="([^"<>]+)">(.+?)<\/a><\/\1>/g,
/**
 * <code>
 <a href="http://www.luoxia.com/wanmei/">完美世界小说</a>
 <a href="http://www.libaiwu.com/2hao/">二号首长</a>
 <a href="http://www.enjing.com/2hao/">二号首长</a>
 <a href=" http://www.luoxia.com/guichui/gcd-5/">鬼吹灯之黄皮子坟</a>
 </code>
 */
// 中間插入的廣告連結。
PATTERN_AD_link = /<a href=" *http:\/\/www\.(?:luoxia|libaiwu|enjing)\.com(?:\/[a-z\d\-_]+){1,2}\/">[^<>]*<\/a>/g,
// 這個網站的語法錯誤。 e.g., 凡人修仙传
PATTERN_syntax_error = /[\s\n]*<\/p>[\s\n]*<\/p>[\s\n]*(<p>)?[\s\n]*/g,
//	
crawler = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。default:false
	// recheck='changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。否則只會自上次下載過的章節接續下載。
	recheck : 'changed',

	// site_name : '',
	base_URL : 'http://www.luoxia.com/',

	// 規範 work id 的正規模式；提取出引數（如 URL）中的作品id 以回傳。
	extract_work_id : function(work_information) {
		return /^[a-z\-]+$/.test(work_information) && work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : '?s=',
	parse_search_result :
	//
	CeL.work_crawler.extract_work_id_from_search_result_link.bind(null,
			/<li class="cat-search-item">([\s\S]+?)<\/li>/g),

	// 取得作品的章節資料。 get_work_data()
	parse_work_data : function(html, get_label, extract_work_data) {
		var data = html.between('<div class="book-describe">', '</div>'),
		//
		work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(data.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			description : get_label(data.between(
					'<div class="describe-html"><p>', '</p>')),
			image : html.between('<div class="book-img">', '</div>').between(
					'<img ').between(' src="', '"'),
			site_name : get_label(html.between('<h1 id="logo">', '</h1>'))
		};
		extract_work_data(work_data, data,
		// e.g., "<p>状态：已完结</p>"
		/<p>([^：]+)：(.+)<\/p>/g);

		Object.assign(work_data, {
			author : work_data.作者,
			status : [ work_data.状态, work_data.类型 ],
			latest_chapter : work_data.最新章节,
			last_update : work_data.最近更新
		});

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		work_data.chapter_list = [];

		html = html.between('id="tithook"', '<script>');

		var part_title, matched;

		while (matched = PATTERN_chapter.exec(html)) {
			// console.log(matched);
			if (matched[1] !== 'li') {
				part_title = matched[2];
				// console.log(part_title);

			} else {
				var chapter_data = {
					url : matched[3],
					part_title : part_title,
					// 這裡的標題可能有缺。
					title : matched[2]
				};
				work_data.chapter_list.push(chapter_data);
			}
		}
	},

	// 取得每一個章節的內容與各個影像資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// 在取得小說章節內容的時候，若發現有章節被目錄漏掉，則將之補上。
		this.check_next_chapter(work_data, chapter_NO, html,
		// PATTERN_next_chapter: [ all, next chapter url ]
		/下一[章页][：: →]*<a [^<>]*?href="([^"]+.html)"[^<>]*>/);

		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		//
		text = html.between('<article class="post', '</article>');
		text = text.between('</nav>') || text.between('>');
		if (/^\s*<div class="ggad/.test(text)) {
			text = text.between('</div>');
		}
		// 去除掉結尾的廣告。 <div id="anchor" class="ggad clearfix">
		text = text.between(null, ' class="ggad clearfix">').replace(/<[^<]+$/,
				'')
		// 去除掉中間插入的廣告。
		.replace(/<!-- Luoxia-middle-random --><div[\s\S]*?<\/div>/, '')
		// 去除掉中間插入的廣告連結。
		.replace(PATTERN_AD_link, '')
		// 修正這個網站的語法錯誤。
		.replace(PATTERN_syntax_error, '</p>\n$1');

		this.add_ebook_chapter(work_data, chapter_NO, {
			sub_title : get_label(
			//
			html.between('<h1 class="post-title">', '</h1>')),
			date : get_label(html.between('<p class="post-time">', '<i>')
			// e.g., <p class="post-time"><b>忘语</b>2015年08月09日<i>
			.replace(/<b>[\s\S]*<\/b>/, '')),
			text : text
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
