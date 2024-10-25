/**
 * 批量下載 比奇中文网 小说 的工具。 Download biqizw novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.PTCMS');

// ----------------------------------------------------------------------------

var crawler = CeL.PTCMS({
	// 2024/3/9 前: https://www.biqizw.com/
	base_URL : 'https://www.biqizw.com/',
	charset : 'gbk',

	search_work_interval : '30s',
	chapter_time_interval : '1s',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'modules/article/search.php?searchkey=',
	parse_search_result : 'biquge',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return (work_id / 1000 | 0) + '_' + work_id + '/';
	},
	// 取得包含章節列表的文字範圍。
	get_chapter_list_contents : function(html) {
		return html.between('<div id="list">', '</div>');
	},
	// 去掉前後網站廣告。
	remove_ads : function remove_ads(text) {
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
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
