/**
 * 批量下載 飞翔鸟中文 的工具。 Download fxnzw novels.
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
	// recheck : 'changed',

	language : 'cmn-Hans-CN',

	// 2022/11/20前: https://www.fxnzw.com/
	base_URL : 'https://www.fxnzw.com/',

	chapter_time_interval : 500,

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(key) {
		return 'fxnlist/' + key + '.html';
	},
	parse_search_result : function(html, get_label) {
		// console.log(html);
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [];

		function parse_section(text) {
			// console.trace(text);
			var matched = text.match(
			//
			/<a href="\/fxnbook\/(\d+)\.html"[^<>]*>([\s\S]+?)<\/a>/);
			if (matched) {
				id_list.push(matched[1]);
				id_data.push(get_label(matched[2]));
			}
		}

		html.each_between('<div id="CrListText">', null, parse_section);

		if (id_list.length === 0
		// 直接跳轉到作品資訊頁面。
		&& (html = html.between('<div class="bkcontent">', '</div>'))) {
			parse_section(html);
		}

		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'fxnbook/' + work_id + '.html';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// console.log(html);
		this.site_name = get_label(html.between('<div class="header_logo">',
				'</div>'));
		var text = html.between('<div class="m_content">');
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			/**
			 * <code>
			<h2>最仙遊<span>文 / <a href="/fxnlist/虾写.html">虾写</a></span></h2>
			</code>
			 */
			title : get_label(text.between('<h2>', '<span>')),
			author : get_label(text.between('<h2>', '</h2>').between('<a ',
					'</a>').between('>')),

			// 選擇性屬性：須配合網站平台更改。
			/**
			 * <code>
			<div class="zhangx">
			<span>最仙遊最新更新章节：</span> <a href="/fxnread/45100_8300365.html">第四百四十一章  群英</a>  更新时间：2015/6/10 10:20:54&nbsp;<li><font color="#CC6600">如果您发现书籍内容倾向等，我们将在24小时内进行处理！</font></li>
			</div>
			</code>
			 */
			latest_chapter : get_label(html.between('<div class="zhangx">',
					'</div>').between('<a ', '</a>').between('>')),
			last_update : get_label(html.between('<div class="zhangx">',
					'</div>').between('</a>', '<li>').between('：')),
			/**
			 * <code>
			<textarea id="CommentText" cols="68" rows="7" name="booksum" readonly="readonly">
			</code>
			 */
			description : get_label(html.between(' id="CommentText"',
					'</textarea>').between('>')),
			image : text.between('<span id="Lab_BookImg">').between(
					'<img src="', '"')
		};

		// 由 meta data 取得作品資訊。
		extract_work_data(work_data, html);

		// console.log(text);
		extract_work_data(work_data, text.between('<ul class="fmclass">',
				'</ul>'), /([^<>：]+)：<span[^<>]*>([\s\S]*?)<\/span>/g);

		// console.log(html);
		// console.log(work_data);
		return work_data;
	},
	// 對於章節列表與作品資訊分列不同頁面(URL)的情況，應該另外指定.chapter_list_URL。
	chapter_list_URL : function(work_id) {
		return 'fxnchapter/' + work_id + '.html';
	},
	get_chapter_list : function(work_data, html, get_label) {
		// <div id="main" class="colors1 sidebar">
		// html = html.between(' id="main"');
		// work_data.last_update = get_label(html.between('更新时间:', '，'));

		html = html.between('<div id="BookText">') || html;

		// reset work_data.chapter_list
		work_data.chapter_list = [];
		html.each_between('<div id="NclassTitle">', null, function(text) {
			var part_title = text.between(null, '</div>');
			// console.trace(part_title);
			if (part_title.includes('正文')) {
				part_title = '';
			}
			crawler.set_part(work_data, part_title);

			text = text.between('<ul>', '</ul>');
			if (!text)
				return;
			// console.log(text);
			text.each_between('<li>', '</li>', function(item) {
				var matched = item.match(
				//
				/<a href="([^<>"]+)"[^<>]* title="([\s\S]+?) 更新时间:([\s\S]+?)">([\s\S]+?)<\/a>/
				//
				);
				if (!matched)
					return;
				var chapter_data = {
					url : matched[1],
					title : get_label(matched[2]),
					date : matched[3]
				};
				crawler.add_chapter(work_data, chapter_data);
			});
		});
		// console.log(work_data.chapter_list);
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);
		// 在取得小說章節內容的時候，若發現有章節被目錄漏掉，則將之補上。
		// this.check_next_chapter(work_data, chapter_NO, html);

		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		if (!chapter_data.title) {
			chapter_data.title = get_label(html.between('<h1>', '</h1>')
			// <h1>最仙遊 第四百四十一章 群英</h1>
			.replace(work_data.title, ''));
		}

		var text = html.between('<!--正文开始-->', '<!--正文结束-->');
		/**
		 * <code>
		请记住:飞翔鸟中文小说网 <a href="http://www.fxnzw.com">www.fxnzw.com</a> 没有弹窗,更新及时 !

		https://www.fxnzw.com/fxnread/50082_11724751.html	剑道第一仙 第一章 灵堂
		顶点小说地址：dingdian6<p/>
		移动端：m.dingdian6感谢您的收藏！  请记住:飞翔鸟中文小说网 <a href="http://www.fxnzw.com">www.fxnzw.com</a> 没有弹窗,更新及时 !

		https://www.fxnzw.com/fxnread/50082_11724769.html	剑道第一仙 第十九章 时来天地皆同力
		《》情节跌宕起伏、扣人心弦，是一本情节与文笔俱佳的玄幻小说，八一转载收集。  请记住:飞翔鸟中文小说网 <a href="http://www.fxnzw.com">www.fxnzw.com</a> 没有弹窗,更新及时 !

		https://www.fxnzw.com/fxnread/50082_11748573.html	剑道第一仙 第2568章 不跪者死
		(:→)如果您认为不错,请,以方便以后跟进剑道第一仙的连载更新  请记住:飞翔鸟中文小说网 <a href="http://www.fxnzw.com">www.fxnzw.com</a> 没有弹窗,更新及时 !
		</code>
		 */
		text = text.replace(/《》情节跌宕起伏、扣人心弦，是一本情节与文笔俱佳的玄幻小说，八一转载收集。/g, '');
		text = text.replace(/顶点小说地址：(?:[\s\w.]|<[^<>]+>)*移动端：[\s\w.]*感谢您的收藏！/g,
				'');
		text = text.replace(/[(:→)]*如果您认为不错,请.*以方便以后跟进.+的连载更新/g, '');
		text = text.replace(/请记住:飞翔鸟中文小说网([\s\S]+)(?:$|<p\/>)/, '');

		text = text.replace(
		/**
		 * <code>
		https://www.fxnzw.com/fxnread/39965_5923228.html
		<img src="/fxnzw/Picimg.aspx?fxnzwurl=677113864063DB8A3B550A5D36176BF46395F675CD8BB8534708F8B3680B7B68A9969CFD97E3C782A9DBB51BEAFF64522F9BEC0031CCDF0B8BFBF838F7746F204AC645F21471F826" alt="今天才是周一，冲榜求推荐票！！！ ( 图0) 九星天辰诀"><br/> ( 飞翔鸟中文小说网 www.fxnzw.com  )
		有些圖採用 http://pic.luoqiu.com/ 落秋中文网?
		</code>
		 */
		/<img src="\/fxnzw\/Picimg.aspx?[^<>]+>(?:<br\/>)?/g, '').replace(
				/\s*\(\s*飞翔鸟中文小说网 [\w.]*\s*\)\s*/g, '');

		if (!text && !chapter_data.title) {
			// e.g., 每個作品最後自動插入的章節。應該會導向作品資訊頁面。
			return;
		}

		text = text.replace(/<p\/>/g, '</p><p>').trim().replace(/[\s\n]<p>$/,
				'');
		if (!/<\/p(\W[^<>]*)?>$/.test(text))
			text += '</p>';
		if (!/^<p(\W[^<>]*)?>/.test(text))
			text = '<p>' + text;

		// text = CeL.work_crawler.fix_general_ADs(text);

		// console.log(text);
		this.add_ebook_chapter(work_data, chapter_NO, text);
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
