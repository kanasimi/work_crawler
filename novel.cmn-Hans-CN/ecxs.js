/**
 * 批量下載 烟草小说网 的工具。 Download ecxs novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.PTCMS');

// ----------------------------------------------------------------------------

var crawler = CeL.PTCMS({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。default:false
	// recheck='changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。否則只會自上次下載過的章節接續下載。
	// recheck : 'changed',

	// site_name : '烟草小说网',

	search_work_interval : '30s',

	// <meta charset="gbk">
	charset : 'gbk',

	// 2024/3/9前: https://www.ecxs.net/
	base_URL : 'https://www.ecxs.net/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'modules/article/search.php?searchkey=',
	// parse_search_result : 'biquge',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		/**
		 * <code>
		// https://www.ecxs.net/book/3740/
		<meta property="og:url" content="https://www.ecxs.net/book/3740/" />
		</code>
		 */
		var matched = html.match(/og:url" content="[^<>"]+?\/(\d+)\/?"/);
		// console.log(matched);
		if (matched) {
			/**
			 * <code>
			// https://www.ecxs.net/book/3740/
			<h1 class="bookTitle">长生：开局一条命，修为全靠苟 <small>/ <a class="red" href="https://www.ecxs.net/modules/article/authorarticle.php?author=%D6%C2%D0%A3%D4%AD" target="_blank">致校原</a></small></h1>
			</code>
			 */
			matched[2] = get_label(html.between('<h1', '</h1>').between('>')
					.replace('全文阅读', ''));
			matched[2] = matched[2].between(null, '<') || matched[2];
			return [ [ +matched[1] ], [ matched[2] ] ];
		}

		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [];

		/**
		 * <code>
		<table class="table"><tr>

		<th class="hidden-xs">分类</th><th>书名</th><th class="hidden-xs">最新章节</th><th>作者</th><th>更新时间</th>
		<tr><td class="hidden-xs">玄幻</td><td><a href="https://www.ecxs.net/book/3740/" target="_blank">长生：开局一条命，修为全靠苟</a></td><td class="hidden-xs"><a href="https://www.ecxs.net/book/3740/3167670.html" target="_blank">第480章 番外，写在最后的信</a></td><td>致校原</td><td>2023-11-08 14:46:38</td></tr>
		</code>
		 */
		html.between('<table', '</table>').each_between('<tr>', '</tr>',
		//
		function(text) {
			// console.log(text);
			var matched = text.match(
			//
			/<a href="[^<>"]+?\/(\d+)\/?"[^<>]*>([\s\S]+?)<\/a>/);
			if (!matched)
				return;
			id_list.push(+matched[1]);
			id_data.push(get_label(matched[2]));
		});

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : 'book/',

	get_chapter_list_contents : function(html) {
		return html.between(' id="list-chapterAll"', '</dl>');
	},

	pre_parse_chapter_data
	//
	: function(XMLHttp, work_data, callback, chapter_NO) {
		var html = XMLHttp.responseText;
		// console.trace(html);

		var matched = html
				.match(/<a id="linkNext"[^<>]* href="([^"<>]+)">下一页<\/a>/);
		if (!matched) {
			callback();
			return;
		}

		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		var text = extract_chapter_text(html);
		text = text.between(null, '... -->>');
		if (!text) {
			CeL.error('網站改版? 無法解析 '
					+ (chapter_data.fetching_now || chapter_data.url));
		}
		chapter_data.previous_text = combine_text(chapter_data, text);

		this.get_URL(chapter_data.fetching_now = work_data.base_url
				+ matched[1], callback);
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		var text = extract_chapter_text(html);
		if (!text) {
			CeL.error('網站改版? 無法解析末頁 '
					+ (chapter_data.fetching_now || chapter_data.url));
			console.trace(html);
		}
		delete chapter_data.fetching_now;

		if (chapter_data.previous_text) {
			text = combine_text(chapter_data, text);
			// free
			delete chapter_data.previous_text;
		}

		this.add_ebook_chapter(work_data, chapter_NO, {
			text : text
		});
	}
});

// --------------------------

function extract_chapter_text(html) {
	var text = html.between('<div class="panel-body" id="htmlContent">',
			'<a id="linkPrev"');
	text = text.between('最新章节！<br><br>',
			'</div><script type="text/javascript">');
	if (text.startsWith(' ')) {
		// e.g., /book/3740/3167200_2.html
		text = text.slice(1);
	}
	return remove_ads(text);
}

function combine_text(chapter_data, text) {
	var previous_text = chapter_data.previous_text;
	if (!previous_text) {
		return text;
	}

	for (var count = 3; count < 8; count++) {
		if (previous_text.slice(-count) === text.slice(0, count)) {
			text = previous_text + text.slice(count);
			previous_text = null;
			break;
		}
	}

	if (previous_text && previous_text.endsWith('<br /> ')) {
		if (text.startsWith('&nbsp;')) {
			previous_text = previous_text.slice(0, -1);
			if (!previous_text.endsWith('<br /><br />'))
				previous_text += '<br />';
			text = previous_text + text;
			previous_text = null;
		} else if ('<br />'.includes(text.between(null, '<br />'))) {
			text = previous_text.slice(0, -1)
					+ text.replace(/^.+?(<br \/>)/, '$1');
			previous_text = null;
		}
	}

	if (previous_text) {
		console.trace([ previous_text.slice(-20), text.slice(0, 20) ]);
		text = previous_text + text;
	}

	return text;
}

function remove_ads(text) {
	// 去掉前後網站廣告。
	text = text.replace(
	/**
	 * <code>
	// https://www.biqizw.com/3_3733/3167227.html	第39章“师兄，承让了！”
	比奇中文网 www.biqizw.com，最快更新长生：开局一条命，修为全靠苟 ！<br><br>
	</code>
	 */
	/[^<>]+中文网\s*[\w.]+，最快更新[^<>]+/, '')

	.replace(
	/**
	 * <code>
	// https://www.biqizw.com/3_3733/3167227.html
	</code>
	 */
	/无尽的昏迷过后，时宇猛地从床上起身。想要看最新章节内容，请下载星星阅读app，[\s\S]+比奇中文/, '')

	.replace(
	/**
	 * <code>
	// https://www.biqizw.com/3_3733/3167227.html
	<br /><br /> &nbsp;&nbsp;&nbsp;&nbsp;&lt;a href=&quot;<a href="http://www.biqizw.com&quot;" target="_blank">http://www.biqizw.com&quot;</a> target=&quot;_blank&quot;&gt;<a href="http://www.biqizw.com&lt;/a&gt;" target="_blank">www.biqizw.com&lt;/a&gt;</a> 比奇中文
	</code>
	 */
	/&lt;a href=[\s\S]+?(<br[^<>]*>|$)/, '$1')

	.replace(
	/**
	 * <code>

	// https://www.biqizw.com/3_3733/3167190.html	长生：开局一条命，修为全靠苟 第2章 宗门里的摸鱼日常
	学不到。Μ.<br /><br /> &nbsp;&nbsp;&nbsp;&nbsp;

	// https://www.biqizw.com/3_3733/3167191.html	长生：开局一条命，修为全靠苟 第3章 猪肉铺的姑娘
	说了话。【1】 【6】 【6】 【小】 【说】<br /><br /> &nbsp;&nbsp;&nbsp;&nbsp;

	// https://www.biqizw.com/3_3733/3167192.html	长生：开局一条命，修为全靠苟 第4章 不试一试，怎么知道不行呢？
	宗门的安危。”ωＷＷ.<br /><br /> &nbsp;&nbsp;&nbsp;&nbsp;

	// https://www.biqizw.com/3_3733/3167194.html	长生：开局一条命，修为全靠苟 第6章 人生若只如初见
	熟悉的面容。大风小说<br /><br /> &nbsp;

	// https://www.biqizw.com/3_3733/3167200.html	长生：开局一条命，修为全靠苟 第12章 苟着也能惹祸上身？
	撂倒了……166小说<br /><br />

	// https://www.biqizw.com/3_3733/3167531.html	长生：开局一条命，修为全靠苟 第341章 百年计划
	166小说 无尽的昏迷过后，时宇猛地从床上起身。
	</code>
	 */
	/(?:ωＷＷ\.|166小说|大风小说|(?<=\W)Μ\.|【1】 【6】 【6】 【小】 【说】)(<br[^<>]*>|\s*$)/g
	//
	, '$1')

	.replace(
	/**
	 * <code>

	// https://www.biqizw.com/3_3733/3167227.html	长生：开局一条命，修为全靠苟 第39章“师兄，承让了！”
	以压倒性的优势取得了胜利。水印广告测试&nbsp;&nbsp; 水印广告测试<br /><br />
	时宇猛地从床上起身。想要看最新章节内容，请下载星星阅读app，无广告免费阅读最新章节内容。网站已经不更新最新章节内容，已经星星阅读小说APP更新最新章节内容。<br /><br />
	这不是他！下载星星阅读app，阅读最新章节内容无广告免费<br /><br />

	</code>
	 */
	/(?:水印广告测试|想要看最新章节内容|下载星星阅读)[^<>]*?(<br[^<>]*>)/, '$1')

	;

	// console.log(text);
	return text;
}

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
