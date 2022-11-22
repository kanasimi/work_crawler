/**
 * 批量下載飘天文学小说阅读网(http://www.piaotian.com/)的工具。 Download piaotian novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// CeL.detect_HTML_language()
, 'application.locale' ]);

// ----------------------------------------------------------------------------

// for Error: unable to verify the first certificate
// code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// 章節以及篇章連結的模式。
var PATTERN_chapter = /<div class="list">(.+)<\/div>|<a href="(\d+\.html)">(.+)<\/a>/g,
// 打廣告就算了；每個章節都要檢查這個資源檔，有些煩人了。
PATTERN_AD = /<a href="http:\/\/www\.piaotian\.com\/?(?:&[a-z]+;[^"]*)?"[^<>]*>[^<>]*<\/a>/ig,
//
crawler = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。default:false
	// recheck='changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。否則只會自上次下載過的章節接續下載。
	// recheck : 'changed',

	// 下載每個作品更換一次 user agent。
	regenerate_user_agent : 'work',

	site_name : '飘天文学',
	// 2018: http://www.piaotian.com/
	// 2019/11/23 前改為: https://www.ptwxz.com/
	base_URL : 'https://www.ptwxz.com/',
	charset : 'gbk',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return [ 'modules/article/search.php', {
			searchtype : 'articlename',
			searchkey : work_title
		} ];
	},
	parse_search_result : function(html, get_label) {
		// console.log(html);
		if (html.includes('<span class="hottext">最新章节：</span>')) {
			// 只有一個作品完全符合，直接 redirects 引導到了作品資訊頁面。
			var matched = html.match(/ href="[^<>"]+?\/\d{1,2}\/(\d{1,5})\/"/);
			// console.log(matched);
			return [ [ matched[1] ],
					[ get_label(html.between('<h1>', '</h1>')) ] ];
		}

		html = html.between('<div id="centerm">', '</div>').between(
				'<div id="content">');
		// test: 吞噬星空,百煉成神,不存在作品
		// console.log(html);
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [], get_next_between = html.find_between(
				'<td class="odd"><a href="', '</a>'), text;

		while ((text = get_next_between()) !== undefined) {
			// 從URL網址中解析出作品id。
			var matched = text.between(null, '"').match(/([\d_]+)\.html$/);
			id_list.push(matched[1]);
			matched = text.between('>');
			id_data.push(get_label(matched));
		}

		if (id_list.length === 0
		// 本站若是找到作品就會直接跳轉，不會顯示搜尋結果。
		&& html.between('<h1>', '</h1>')) {
			text = html.between('href="' + this.base_URL + 'html/', '"');
			// 從URL網址中解析出作品id。
			var matched = text.match(/([\d_]+)(?:\/|\.html)$/);
			return [ [ matched[1] ],
					[ get_label(html.between('<h1>', '</h1>')) ] ];
		}
		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'bookinfo/' + (work_id.slice(0, -3) || 0) + '/' + work_id
				+ '.html';
	},
	parse_work_data : function(html, get_label) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			latest_chapter : get_label(html.between(
					'<span class="hottext">最新章节：</span>', '</a>')),
			description : get_label(html.between(
					'<span class="hottext">内容简介：</span>', '</td>')),
			image : html.between('<td width="80%" valign="top">').between(
					'<img src="', '"')
		};
		// piaotian 有時會 502，但是重新再擷取一次就可以了。
		if (work_data.title === '502 Bad Gateway') {
			return this.REGET_PAGE;
		}

		html.between('<h1>', '<div')
		//
		.each_between('<td', '</td>', function(text) {
			var matched = text.between('>').match(/^(.+?)：(.*?)$/);
			// console.log(matched || text);
			if (matched) {
				work_data[get_label(matched[1].replace(/(?:\s|&nbsp;)+/g, ''))]
				//
				= get_label(matched[2]) || '';
			}
		});

		work_data = Object.assign({
			// 選擇性屬性：須配合網站平台更改。
			// e.g., 连载中, 連載中
			// <span id="noveltype">完結済</span>全1部
			// <span id="noveltype_notend">連載中</span>全1部
			status : work_data.文章状态,
			author : work_data.作者,
			last_update : work_data.最后更新
		}, work_data);

		// console.log(html);
		// console.log(work_data);
		return work_data;
	},
	// 對於章節列表與作品資訊分列不同頁面(URL)的情況，應該另外指定.chapter_list_URL。
	chapter_list_URL : function(work_id) {
		return 'html/' + (work_id.slice(0, -3) || 0) + '/' + work_id
				+ '/index.html';
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between('<div class="centent">', '<div class="bottom">');
		work_data.chapter_list = [];
		var matched, part_title, base_url = work_data.base_url = this
				.chapter_list_URL(work_data.id).replace(/[^\/]+$/, '');
		while (matched = PATTERN_chapter.exec(html)) {
			if (matched[1]) {
				part_title = get_label(matched[1]);
				if (part_title.includes('正文')) {
					// e.g., 《...》正文卷
					part_title = '';
				}
				// console.log(part_title);

			} else {
				var chapter_data = {
					url : base_url + matched[2],
					part_title : part_title,
					title : get_label(matched[3]),
				};
				work_data.chapter_list.push(chapter_data);
			}
		}
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);
		// 在取得小說章節內容的時候，若發現有章節被目錄漏掉，則將之補上。
		this.check_next_chapter(work_data, chapter_NO, html);

		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		//
		text = html.between('</H1>');
		// e.g.,
		// http://www.piaotian.com/html/3/3596/1808085.html
		// http://www.piaotian.com/html/1/1251/576785.html
		// http://www.piaotian.com/html/0/39/5757.html
		text = text.between('\n<br>', '</div>')
		// http://www.piaotian.com/html/7/7446/4807895.html
		|| text.between('<div class="ad_content">', '<div class="bottomlink">')
		//
		.between('</div>', '</div>');

		text = text
		// 去除掉 <script> 功能碼。
		.replace(/<script[^<>]*>[^<>]*<\/script>/g, '')

		// 去除廣告。

		// 琥珀之剑 第四卷 第二百八十九幕 时间的长度 https://www.ptwxz.com/html/2/2827/1322197.html
		.replace(/&lt;a href=&quot;[\x20-\xff]+&lt;\/a&gt;(?:<\/a>)*/, '')

		// 去除掉廣告。
		.replace(PATTERN_AD, '')
		// 咫尺之间人尽敌国 第一千零四章 神国 https://www.ptwxz.com/html/10/10231/7979150.html
		.replace(/水印广告测试(?:&nbsp;)*/g, '')

		// 开局奖励一亿条命 第30章对着空气输出 https://www.ptwxz.com/html/12/12788/8819018.html
		// [新筆趣閣 www.xsbiquge.info]
		// [紅旗小說 www.hongqibook.com]
		// 开局奖励一亿条命 第39章还来 https://www.ptwxz.com/html/12/12788/8819027.html
		// [筆趣閣5200 www.bqg5200.co]
		// [新筆趣閣 www.xxbiquge.vip]
		// [新筆趣閣 www.biqule.info]
		// 开局奖励一亿条命 第192章人家点的是你的名
		// https://www.ptwxz.com/html/12/12788/8819376.html
		// [txt小说 www.txtyuan.com]
		.replace(/\[\w*[\u4e00-\u9fff]+\d* www\.\w+\.\w+\]/g, '')

		/**
		 * <code>

		// https://www.ptwxz.com/html/14/14466/9866209.html
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;銆愯瘽璇达紝鐩鍓嶆湕璇诲惉涔︽渶濂界敤鐨刟pp锛屽挭鍜闃呰伙紝 瀹夎呮渶鏂扮増銆傘<br /><br />
		// https://www.bqg9527.com/zh_hant/book/194082/167532218.html
		&nbsp;&nbsp;&nbsp;&nbsp;銆愯瘽璇達紝鐩?鍓嶆湕璇誨惉涔︽滃ソ鐢1殑app錛屽挭鍜?闃呰?夥紝?瀹夎?呮滄柊鐗堛?傘?/p&amp;gt;<br/>
		// https://uukanshu.cc/book/16523/11534208.html
		&emsp;&emsp;銆愯瘽璇達紝鐩鍓嶆湕璇誨惉涔︽渶濂界敤鐨刟pp錛屽挭鍜闃呰伙紝 瀹夎呮渶鏂扮増銆傘<br />
		// https://www.ptwxz.com/html/14/14466/9867006.html
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;銆愭帹鑽愪笅锛屽挭鍜闃呰昏拷涔︾湡鐨勫ソ鐢锛岃繖閲屼笅杞&nbsp;&nbsp;澶у跺幓蹇鍙浠ヨ瘯璇曞惂銆傘<br /><br />
		// https://www.ptwxz.com/html/14/14466/9828256.html
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;銆愯茬湡锛屾渶杩戜竴鐩寸敤鍜鍜闃呰荤湅涔﹁拷鏇达紝鎹㈡簮鍒囨崲锛屾湕璇婚煶鑹插氾紝 瀹夊崜鑻规灉鍧囧彲銆傘<br /><br />

		</code>
		 */
		.replace(/銆[愯愭][^<>\n]{30,60}傘[\w\/?&;]*(?:<br\s*\/?>)*/g, '')
		/**
		 * <code>

		// https://www.ptwxz.com/html/14/14466/9830853.html
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;銆愯よ瘑鍗佸勾鐨勮佷功鍙嬬粰鎴戞帹鑽愮殑杩戒功app锛屽挭鍜闃呰伙紒鐪熺壒涔堝ソ鐢锛屽紑杞︺佺潯鍓嶉兘闈犺繖涓鏈楄诲惉涔︽墦鍙戞椂闂达紝杩欓噷鍙浠ヤ笅杞&nbsp;&nbsp;銆<br /><br />

		</code>
		 */
		.replace(/銆[愯愭][^<>\n]{80,90}銆[\w\/?&;]*(?:<br\s*\/?>)*/g, '')
		/**
		 * <code>

		// https://www.ptwxz.com/html/13/13305/9960310.html
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;谷輥<br /><br />
		// https://www.ptwxz.com/html/13/13305/9961817.html
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;谷婚<br /><br />

		</code>
		 */
		.replace(/(?:<br\s*\/?>)+(?:&nbsp;)*谷.(<br\s*\/?>)/g, '$1')

		/**
		 * <code>

		// https://www.ptwxz.com/html/6/6682/3766047.html 最仙遊 正文 第四十二章 镇天关内
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;;

		</code>
		 */
		.replace(/(?:<br\s*\/?>)+(?:&nbsp;)*;+[\s\n]*$/, '')

		/**
		 * <code>

		// https://www.ptwxz.com/html/1/1073/2450032.html 斩仙 正文 给个鼓励吧
		(未完待续。请搜索飄天文學，小说更好更新更快!)

		// https://www.ptwxz.com/html/6/6682/3844397.html 最仙遊 正文 第一百一十四章 选拔（下）
		(未完待续请搜索飄天文學，小说更好更新更快!

		// https://www.ptwxz.com/html/3/3704/2309955.html 极品天骄 第一卷 今天只有两更了，求一下保底月票！
		(未完待续。请搜索飄天文學，小说更好更新更快!手机用户请到m.本站阅读。)

		// http://www.tyksjq.com/bqg/13026/2628523_2.html
		(未完待续。请搜索飄天文學，小说更好更新更快!)&nbsp;&nbsp;&lt;!--章节内容结束--&gt;

		// https://m.77xsw.cc/article/1108/2168117_2.html
		(未完待续请搜索飄天文學，小说更好更新更快!<br /><br /> &nbsp;&nbsp;&nbsp;&nbsp;ps：明天是端午节，猪三在这里视兄弟们合家安康！ 

		// https://m.ijjxsw.co/txt/9868/12896239_2.html
		<p>未完待续未完待续请搜索飄天文學，小说更好更新更快!</p><p>ps：衷心感谢：嘉存书友的打赏支持，多谢！</p>

		// http://m.xhytd.com/5/5819/5436882_3.html
		(未完待续。请搜索飄天文學，)    

		// https://m.tszw.org/read/2/2799/2512310_1.html
		（未完待续。请搜索飄天文學，）</p><p>手机用户请浏览吞噬小说网{m.tszw.org}</p></div>

		// https://m.tianyibook.la/book/6311/5018720_2.html
		(未完待续请搜索飄天文學，小说更好更新更快!<br /><br />

		// https://www.ptwxz.com/html/6/6682/3831784.html 最仙遊 正文 第九十五章 试探
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;手机用户请到m..阅读。

		https://www.ptwxz.com/html/6/6682/3997171.html
		您的支持，就是我最大的动力请搜索飄天文學，小说更好更新更快!88读书<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;...

		</code>
		 */
		.replace(/([(（]?未完待续[^<>\n]{1,20}|请搜索)飄天文學(?:[^<>\n]*\n*|.*\n*$)/, '')
		/**
		 * <code>

		https://www.ptwxz.com/html/6/6682/3831784.html 最仙遊 正文 第九十五章 试探
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;手机用户请到m..阅读。

		</code>
		 */
		.replace(/(?:<br\s*\/?>)+(?:&nbsp;)*手机用户请[^<>]*$/, '')

		/**
		 * <code>

		https://www.ptwxz.com/html/6/6682/4072541.html 最仙遊 正文 第三百五十二章 九凤古鼎
		&nbsp;&nbsp;&nbsp;&nbsp;纯文字在线阅读本站域名手机同步阅读请访问<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;

		</code>
		 */
		.replace(/(?:&nbsp;)*纯文字在线阅读[^<>]*(?:<br\s*\/?>)+/, '')

		/**
		 * <code>

		// https://www.ptwxz.com/html/13/13305/9231800.html	我宅了百年出门已无敌 第一百一十五章老贼，休想乱我道心
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;7017k<br /><br />

		</code>
		 */
		.replace(/7017k(?:<br\s*\/?>)+/g, '')

		/**
		 * <code>

		// https://www.ptwxz.com/html/13/13305/9697354.html	我宅了百年出门已无敌 第四百零五章开道神速
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;请记住本书首发域名：。_wap.<br /><br />

		// https://www.ptwxz.com/html/14/14466/10213364.html 女主从书里跑出来了怎么办 第五百三十一章 紫薇大帝
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;请记住本书首发域名：。手机版阅读网址：wap.<br /><br />

		</code>
		 */
		.replace(/请记住本书首发域名：[\w.。]*(?:手机版阅读网址：[\w.。]*)?(?:<br\s*\/?>)+/g, '')

		/**
		 * <code>

		// https://www.ptwxz.com/html/6/6682/3932535.html	最仙遊 正文 第两百三十九章 星罗密布
		&nbsp;&nbsp;&nbsp;&nbsp;纯文字在线阅读本站域名<foncolor=red>手机同步阅读请访问<br /><br />

		</code>
		 */
		.replace(/(?:&nbsp;)*纯文字在线阅读本站域名<[^<>]+>手机同步阅读请访问(?:<br\s*\/?>)+/g, '')

		/**
		 * <code>

		// https://www.ptwxz.com/html/6/6682/3851642.html 最仙遊 正文 第一百二十六章 强敌 （谢盟更之一）
		其所说十有*为真。

		</code>
		 */
		.replace(/十有\*{1,2}([^*])/g, '十有八九$1')

		// 一品修仙 正文 第二四三章 我不是幻觉，不信你捅我一剑试试
		// https://www.ptwxz.com/html/9/9503/6476110.html
		// 一品修仙 正文 第三六四章 黎族的大佬套路深，还没动手他就快完蛋了
		// https://www.ptwxz.com/html/9/9503/6750266.html
		// <br /><br />&nbsp;&nbsp;&nbsp;&nbsp;https:
		// <br /><br />&nbsp;&nbsp;&nbsp;&nbsp;天才本站地址：。m.
		// .replace('https:<br', '<br').replace('天才本站地址：。m.', '')
		;
		// console.log(text);

		text = CeL.work_crawler.fix_general_ADs(text);

		this.add_ebook_chapter(work_data, chapter_NO, {
			title : chapter_data.part_title,
			sub_title : chapter_data.title
					|| get_label(html.between('<H1>', '</H1>')),
			text : text
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
