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
// https://github.com/gedoor/legado/issues/1961
PATTERN_wzsy = /(?:&nbsp;)*(?:<p>)?<a\s([^<>]+)>[^<>]*<\/a>(?:<br\s*\/?>)*(?:<\/p>)?/g,
//
PATTERN_app_1 = /(?:&nbsp;)*(?:&emsp;)*(?:推荐下|广个告|求助下|插播一个)[^<>]*?app[^<>]{0,50}(?:<br\s*\/?>)+/g,
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
	// 2023/8/17 前改為: https://www.piaotian.com/
	base_URL : 'https://www.piaotian.com/',
	// <meta HTTP-EQUIV="Content-Type" content="text/html; charset=gb2312" />
	charset : 'gbk',

	chapter_time_interval : 500,

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
		// console.log(work_data);
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
		.replace(/<script[^<>]*>[^<>]*<\/script>/g, '');

		// ----------------------------

		// 去除一開始的標題。
		/**
		 * <code>

		// https://www.piaotian.com/html/14/14431/10164343.html	道诡异仙 第434章 北风
		// &nbsp;&nbsp;&nbsp;&nbsp;第434章 北风

		// https://www.piaotian.com/html/9/9051/5938845.html	超神机械师 011 天若有情天亦老，我为萧哥***

		// https://www.piaotian.com/html/5/5982/3239153.html	随波逐流之一代军师 外传 清梵曲

		// https://www.piaotian.com/html/14/14431/10565524.html	道诡异仙 第1027章 番外1 感谢白银盟主（李火旺0402生
		&nbsp;&nbsp;&nbsp;&nbsp;第1027章 番外1 感谢白银盟主（李火旺0402生日快乐）的打赏。<br/><br/>

		</code>
		 */
		if (true || /第.+章/.test(chapter_data.title)) {
			text = text.replace(new RegExp(/^(?:&nbsp;|\s)*/.source
					+ CeL.to_RegExp_pattern(chapter_data.title)
					+ /\s*(?:<br\s*\/?>)+/.source), '')
		}

		// ----------------------------
		// 回復被審核屏蔽的文字

		text = text

		/**
		 * <code>

		// https://www.piaotian.com/html/13/13793/9355310.html	我只想安静的做个苟道中人 第一百七十六章：你想要什么？（第一更！求订阅！）
		艹亻尔女马的郑荆山！
		扌喿扌喿扌喿！！！
		// avoid: "那位少女馬上眼前一亮"	劍仙三千萬-第六十六章武宗

		// https://www.piaotian.com/html/13/13793/9355452.html	我只想安静的做个苟道中人 第四十八章：再来一次。（第四更！求订阅！）
		接着就开始被厉师姐采衤卜……

		// https://www.piaotian.com/html/13/13793/9355454.html	我只想安静的做个苟道中人 第五十章：太刺激了。（第一更！求订阅！）
		这是要在光天化日之下里予占戈？

		// https://www.piaotian.com/html/13/13793/9355285.html	我只想安静的做个苟道中人 第一百五十一章：厉仙子的大长腿。（第二更！求订阅！）
		艹亻也女马白勺！

		女干氵?掳掠
		女干夫氵女彐
		钅肖魂入骨
		禁女干乱
		那月匈……

		</code>
		 */
		.replace(/亻尔女马/g, '你媽').replace(/亻尔/g, '你').replace(/扌喿/g, '操')
		//
		.replace(/衤卜/g, '補').replace(/里予占戈/g, '野戰')
		//
		.replace(/米青丬士/g, '精壮').replace(/口申口今/g, '呻吟').replace(/月几月夫/g, '肌肤')
		// 孚乚汁
		.replace(/酉禾月匈/g, '酥胸').replace(/酉禾孚乚/g, '酥乳').replace(/孚乚/g, '乳')
		// 冫夌辱
		.replace(/冫夌/g, '凌')
		// 忄青趣
		.replace(/忄青/g, '情')
		// 忄夬感
		.replace(/忄夬/g, '快')
		// 衤果体 衤果露
		.replace(/衤果/g, '裸')

		/**
		 * <code>

		// https://www.piaotian.com/html/14/14229/9757030.html	修仙三百年突然发现是武侠 第一百二十五章 飞剑千里取人头
		我渡法马上就要彻底蜕去这**凡胎，成就罗汉金身了！

		// 肉眼凡胎

		</code>
		 */
		.replace(/([^*])\*{2}凡胎/g, '$1肉体凡胎')

		/**
		 * <code>

		// https://www.ptwxz.com/html/6/6682/3851642.html	最仙遊 正文 第一百二十六章 强敌 （谢盟更之一）
		其所说十有*为真。

		</code>
		 */
		.replace(/十有\*{1,2}([^*])/g, '十有八九$1')

		/**
		 * <code>

		// https://www.piaotian.com/html/14/14229/9785496.html	修仙三百年突然发现是武侠 第一百四十八章 心魔蛊惑，恭请九火炎龙！
		意味着这个猜测**不离十。

		</code>
		 */
		.replace(/([^*])\*{2}不离十/g, '$1八九不离十');

		// ----------------------------
		// 去除廣告。

		// 琥珀之剑 第四卷 第二百八十九幕 时间的长度
		// https://www.ptwxz.com/html/2/2827/1322197.html
		text = text.replace(
				/&lt;a href=&quot;[\x20-\xff]+&lt;\/a&gt;(?:<\/a>)*/, '')

		// 去除掉廣告。
		.replace(PATTERN_AD, '')
		// 咫尺之间人尽敌国 第一千零四章 神国 https://www.ptwxz.com/html/10/10231/7979150.html
		.replace(/水印广告测试(?:&nbsp;)*/g, '')

		/**
		 * <code>

		// https://www.ptwxz.com/html/12/12788/8819018.html	开局奖励一亿条命 第30章对着空气输出
		// [新筆趣閣 www.xsbiquge.info]
		// [紅旗小說 www.hongqibook.com]

		// https://www.ptwxz.com/html/12/12788/8819027.html	开局奖励一亿条命 第39章还来
		// [筆趣閣5200 www.bqg5200.co]
		// [新筆趣閣 www.xxbiquge.vip]
		// [新筆趣閣 www.biqule.info]

		// https://www.ptwxz.com/html/12/12788/8819376.html	开局奖励一亿条命 第192章人家点的是你的名
		// [txt小说 www.txtyuan.com]

		// https://www.piaotian.com/html/11/11627/8733404.html	剑宗旁门 第五百五十六章 大衍书阁
		// 说是有上界大能要借这大衍学宫的书阁降下意念来[ www.biqugexx.xyz]与剑崖教众人进行沟通。<br /><br />

		</code>
		 */
		.replace(/\[\w*[\u4e00-\u9fff]*\d* www\.\w+\.\w+\]/g, '')

		/**
		 * <code>

		// https://www.ptwxz.com/html/14/14466/9866209.html
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;銆愯瘽璇达紝鐩鍓嶆湕璇诲惉涔︽渶濂界敤鐨刟pp锛屽挭鍜闃呰伙紝 瀹夎呮渶鏂扮増銆傘<br /><br />

		// https://www.bqg9527.com/zh_hant/book/194082/167532218.html
		&nbsp;&nbsp;&nbsp;&nbsp;銆愯瘽璇達紝鐩?鍓嶆湕璇誨惉涔︽滃ソ鐢1殑app錛屽挭鍜?闃呰?夥紝?瀹夎?呮滄柊鐗堛?傘?/p&amp;gt;<br/>

		// https://www.piaotian.com/html/12/12964/9918868.html	顶级气运，悄悄修炼千年 第990章 踏魔路
		&nbsp;&nbsp;&nbsp;&nbsp;銆愭帹鑽愪笅锛屽挭鍜槄璇昏拷涔︾湡鐨勫ソ鐢紝杩欓噷涓嬭浇澶у鍘诲揩鍙互璇曡瘯鍚с€傘€/p><br /><br />

		// https://uukanshu.cc/book/16523/11534208.html
		&emsp;&emsp;銆愯瘽璇達紝鐩鍓嶆湕璇誨惉涔︽渶濂界敤鐨刟pp錛屽挭鍜闃呰伙紝 瀹夎呮渶鏂扮増銆傘<br />

		// https://www.ptwxz.com/html/14/14466/9867006.html
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;銆愭帹鑽愪笅锛屽挭鍜闃呰昏拷涔︾湡鐨勫ソ鐢锛岃繖閲屼笅杞&nbsp;&nbsp;澶у跺幓蹇鍙浠ヨ瘯璇曞惂銆傘<br /><br />

		// https://www.ptwxz.com/html/14/14466/9828256.html
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;銆愯茬湡锛屾渶杩戜竴鐩寸敤鍜鍜闃呰荤湅涔﹁拷鏇达紝鎹㈡簮鍒囨崲锛屾湕璇婚煶鑹插氾紝 瀹夊崜鑻规灉鍧囧彲銆傘<br /><br />

		</code>
		 */
		.replace(/(?:&nbsp;)*銆[愯愭][^<>\n]{30,60}傘[\w\/?&;€>]*(?:<br\s*\/?>)*/g,
				'')
		/**
		 * <code>

		// https://www.ptwxz.com/html/14/14466/9830853.html
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;銆愯よ瘑鍗佸勾鐨勮佷功鍙嬬粰鎴戞帹鑽愮殑杩戒功app锛屽挭鍜闃呰伙紒鐪熺壒涔堝ソ鐢锛屽紑杞︺佺潯鍓嶉兘闈犺繖涓鏈楄诲惉涔︽墦鍙戞椂闂达紝杩欓噷鍙浠ヤ笅杞&nbsp;&nbsp;銆<br /><br />

		</code>
		 */
		.replace(/(?:&nbsp;)*銆[愯愭][^<>\n]{80,90}銆[\w\/?&;]*(?:<br\s*\/?>)*/g,
				'')

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

		// https://www.piaotian.com/html/14/14229/9733468.html	修仙三百年突然发现是武侠 第一百零九章 她叫姜七七
		还能引动仙剑异象时更加震惊。谷<br/><br/>

		</code>
		 */
		.replace(/(。)谷(<br\s*\/?>)/g, '$1$2')
		/**
		 * <code>

		// https://www.piaotian.com/html/14/14229/9707828.html	修仙三百年突然发现是武侠 第九十三章 这都是道一宫的阴谋
		任太守觉得这有几分可信？”spanstyle>谷/spanstyle><br/><br/>

		</code>
		 */
		.replace(/spanstyle>谷\/spanstyle>/g, '')
		/**
		 * <code>

		// https://www.piaotian.com/html/14/14229/9712346.html	修仙三百年突然发现是武侠 第九十九章 百年前的那一战
		&nbsp;&nbsp;&nbsp;&nbsp;谷/span>　　天仙？<br/><br/>

		</code>
		 */
		.replace(/谷\/span>/g, '')

		/**
		 * <code>

		// https://www.piaotian.com/html/14/14229/9907283.html	修仙三百年突然发现是武侠 第二百五十章 三十万年前，上天崩灭
		强牺tianlaixw.读牺<br/><br/>
		// https://www.piaotian.com/html/14/14229/9923535.html	修仙三百年突然发现是武侠 第二百六十五章 肉身之力，徒手撕飞梭
		。强牺读牺<br/><br/>
		// https://www.cpafarm.com/book/34437/44.html	石更俞凤琴 > 第44章：这招对我没用
		&#24378&#29306&#32&#116&#105&#97&#110&#108&#97&#105&#120&#119&#46&#99&#111&#109&#32&#35835&#29306<br /><br />

		// https://www.piaotian.com/html/12/12964/9952296.html	顶级气运，悄悄修炼千年 第1022章 帝星之盛势
		<br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;强牺读牺。坐于首座的中年男子正是厉遥之子，韩云瑾。<br/><br/>

		</code>
		 */
		.replace(/强牺\s*[a-z.]*\s*读牺。?/g, '')

		/**
		 * <code>

		// https://www.ptwxz.com/html/6/6682/3766047.html	最仙遊 正文 第四十二章 镇天关内
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;;

		</code>
		 */
		.replace(/(?:<br\s*\/?>)+(?:&nbsp;)*;+[\s\n]*$/, '')

		/**
		 * <code>

		// https://www.ptwxz.com/html/13/13305/9231800.html	我宅了百年出门已无敌 第一百一十五章老贼，休想乱我道心
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;7017k<br /><br />

		</code>
		 */
		.replace(/7017k(?:<br\s*\/?>)+/g, '')

		.replace(
		/**
		 * <code>

		// https://www.ptwxz.com/html/1/1073/2450032.html	斩仙 正文 给个鼓励吧
		(未完待续。请搜索飄天文學，小说更好更新更快!)

		// https://www.ptwxz.com/html/6/6682/3844397.html	最仙遊 正文 第一百一十四章 选拔（下）
		(未完待续请搜索飄天文學，小说更好更新更快!

		// https://www.ptwxz.com/html/3/3704/2309955.html	极品天骄 第一卷 今天只有两更了，求一下保底月票！
		(未完待续。请搜索飄天文學，小说更好更新更快!手机用户请到m.本站阅读。)

		// http://www.tyksjq.com/bqg/13026/2628523_2.html
		(未完待续。请搜索飄天文學，小说更好更新更快!)&nbsp;&nbsp;&lt;!--章节内容结束--&gt;

		// https://m.77xsw.cc/article/1108/2168117_2.html
		(未完待续请搜索飄天文學，小说更好更新更快!<br /><br /> &nbsp;&nbsp;&nbsp;&nbsp;ps：明天是端午节，猪三在这里视兄弟们合家安康！ 

		// https://m.ijjxsw.co/txt/9868/12896239_2.html
		<p>未完待续未完待续请搜索飄天文學，小说更好更新更快!</p><p>ps：衷心感谢：嘉存书友的打赏支持，多谢！</p>

		// https://m.tianyibook.la/book/6311/5018720_2.html
		(未完待续请搜索飄天文學，小说更好更新更快!<br /><br />

		https://www.ptwxz.com/html/5/5150/2668008.html
		茜茜的麒麟，s请搜索飄天文學，小说更好更新更快!g的打赏！感谢大家的推荐票！

		https://www.ptwxz.com/html/6/6682/3891370.html	最仙遊 正文 第一百八十七章 破碎虚空 （1800）
		烈火老祖就没有了这颗棋子。(未完待续请搜索飄天文學，小说更好更新更快!u<br /><br />

		https://www.ptwxz.com/html/6/6682/3997171.html	最仙遊 正文 第两百七十一章 东海城
		就是我最大的动力请搜索飄天文學，小说更好更新更快!88读书<br /><br />

		</code>
		 */
		/[(（]?(?:未完待续)*。?请搜索飄天文學，小说更好更新更快!(?:手机用户[^)]+)?\)?(?:88读书)?(\w(?=<))?/
		//
		, '')
		/**
		 * <code>

		// http://m.xhytd.com/5/5819/5436882_3.html
		(未完待续。请搜索飄天文學，)    

		// https://m.tszw.org/read/2/2799/2512310_1.html
		（未完待续。请搜索飄天文學，）</p><p>手机用户请浏览吞噬小说网{m.tszw.org}</p></div>

		https://www.ptwxz.com/html/6/6682/3997171.html
		您的支持，就是我最大的动力请搜索飄天文學，小说更好更新更快!88读书<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;...

		</code>
		 */
		.replace(/([(（]?未完待续[^<>\n]{1,20}|请搜索)飄天文學(?:[^<>\n]*\n*|.*\n*$)/, '')
		/**
		 * <code>

		https://www.ptwxz.com/html/6/6682/3831784.html	最仙遊 正文 第九十五章 试探
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;手机用户请到m..阅读。

		</code>
		 */
		.replace(/(?:<br\s*\/?>)+(?:&nbsp;)*手机用户请[^<>]*$/, '')
		/**
		 * <code>

		https://www.piaotian.com/html/3/3353/1705022.html	问镜 正文 第1章 上仙
		&nbsp;&nbsp;&nbsp;&nbsp;{飘天文学<a href="https://www.piaotian.com" target="_blank">www.piaotian.com</a>感谢各位书友的支持，您的支持就是我们最大的动力}

		</code>
		 */
		.replace(/(?:<br\s*\/?>|\n)*(?:&nbsp;)*.*?您的支持就是我们[^<>]*/g, '')

		.replace(
		/**
		 * <code>

		// https://www.ptwxz.com/html/13/13305/9697354.html	我宅了百年出门已无敌 第四百零五章开道神速
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;请记住本书首发域名：。_wap.<br /><br />

		// https://www.ptwxz.com/html/14/14466/10213364.html	女主从书里跑出来了怎么办 第五百三十一章 紫薇大帝
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;请记住本书首发域名：。手机版阅读网址：wap.<br /><br />

		</code>
		 */
		/(?:&nbsp;)*请记住本书首发域名：[\w.。]*(?:手机版阅读网址：[\w.。]*)?(?:<br\s*\/?>)+/g, '')

		.replace(
		/**
		 * <code>

		// https://www.ptwxz.com/html/6/6682/3932535.html	最仙遊 正文 第两百三十九章 星罗密布
		&nbsp;&nbsp;&nbsp;&nbsp;纯文字在线阅读本站域名<foncolor=red>手机同步阅读请访问<br /><br />

		https://www.ptwxz.com/html/6/6682/4072541.html	最仙遊 正文 第三百五十二章 九凤古鼎
		&nbsp;&nbsp;&nbsp;&nbsp;纯文字在线阅读本站域名手机同步阅读请访问<br /><br />

		</code>
		 */
		/(?:&nbsp;)*纯文字在线阅读本站域名(?:<[^<>]+>)?手机同步阅读请访问(?:<br\s*\/?>)+/g, '')

		/**
		 * <code>

		// https://www.ptwxz.com/html/14/14741/10090277.html	大乘期才有逆袭系统 第四百二十九章 姬空空的烦恼
		<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;天才本站地址：。阅读网址：<br /><br />

		</code>
		 */
		.replace(/(?:&nbsp;)*天才本站地址：。阅读网址：(?:<br\s*\/?>)+/g, '')

		/**
		 * <code>

		// https://www.piaotian.com/html/14/14431/9827254.html	道诡异仙 第一百零九章 伤
		。 为你提供最快的道诡异仙更新，第一百三十二章 路上免费阅读。:.<br /><br />

		</code>
		 */
		.replace(/\s*为你提供最快的[^<>]*?更新，[^<>]*?免费阅读。[^<>]*(?:<br\s*\/?>)+/g, '')

		/**
		 * TODO <code>

		// https://www.piaotian.com/html/14/14229/9962425.html	修仙三百年突然发现是武侠 第二百九十章 那好似来自无穷高处的目光
		&nbsp;&nbsp;&nbsp;&nbsp;没有弹窗,更新及时 !<br/><br/>

		// https://www.piaotian.com/html/14/14229/9962689.html	修仙三百年突然发现是武侠 第二百九十一章 这是一个小小的意外
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;没有弹窗,更新及时&nbsp;&nbsp;!<br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;7<br/><br/>

		</code>
		 */

		.replace(
		/**
		 * <code>

		// https://www.piaotian.com/html/11/11627/8687967.html	剑宗旁门 第五百三十一章 中洲见闻
		&nbsp;&nbsp;&nbsp;&nbsp;【看书领现金】关注vx公.众号【书友大本营】，看书还可领现金！<br /><br />

		// https://www.piaotian.com/html/11/11627/8705477.html	剑宗旁门 第五百四十章 自我感觉良好的叛逆
		&nbsp;&nbsp;&nbsp;&nbsp;&emsp;&emsp;关注公众号：书友大本营，关注即送现金、点币！<br /><br />

		// https://www.piaotian.com/html/11/11627/8696399.html	剑宗旁门 第五百三十三章 婆婆妈妈
		&nbsp;&nbsp;&nbsp;&nbsp;【领红包】现金or点币红包已经发放到你的账户！微信关注公.众.号【书粉基地】领取！<br /><br />

		// https://www.piaotian.com/html/11/11627/8743189.html	剑宗旁门 第五百六十三章 被玩坏的祖师
		&nbsp;&nbsp;&nbsp;&nbsp;&emsp;&emsp;领红包现金or点币红包已经发放到你的账户！微信关注公.众.号领取！<br /><br />

		// https://www.piaotian.com/html/11/11627/9040949.html	剑宗旁门 第七百六十二章 冥渊天地
		&nbsp;&nbsp;&nbsp;&nbsp;&emsp;&emsp;本书由公众号整理制作。关注VX看书领现金红包！<br /><br />

		// https://www.piaotian.com/html/11/11627/9035564.html	剑宗旁门 第七百五十七章 不甘心失败的明珠界
		&nbsp;&nbsp;&nbsp;&nbsp;&emsp;&emsp;【看书福利】关注公众号每天看书抽现金/点币!<br /><br />

		</code>
		 */
		/(?:&nbsp;)*[^<>]*?(?:书友大本营|书粉基地|领红包现金|领现金红包|看书抽现金)[^<>]{0,50}(?:<br\s*\/?>)+/g
		// 整行抽掉
		, '')

		/**
		 * <code>

		// https://www.piaotian.com/html/11/11627/8856761.html	剑宗旁门 第六百三十二章 上界仙宴
		&nbsp;&nbsp;&nbsp;&nbsp;&emsp;&emsp;插播一个app: 完美复刻追书神器旧版本可换源的APP—— 。<br /><br />

		// https://www.piaotian.com/html/11/11627/8951740.html	剑宗旁门 第七百章 神力轰击
		&nbsp;&nbsp;&nbsp;&nbsp;&emsp;&emsp;推荐下，我最近在用的看书app，【 app&emsp;】书源多，书籍全，更新快！<br /><br />

		// https://www.piaotian.com/html/11/11627/8960916.html	剑宗旁门 第七百零七章 无限投影战术
		&nbsp;&nbsp;&nbsp;&nbsp;&emsp;&emsp;广个告，【 app&emsp;】真心不错，值得装个，竟然安卓苹果手机都支持！<br /><br />

		// https://www.piaotian.com/html/11/11627/8988597.html	剑宗旁门 第七百二十七章 让人操心的祖师
		&nbsp;&nbsp;&nbsp;&nbsp;&emsp;&emsp;求助下，【app 】可以像偷菜一样的偷书票了，快来偷好友的书票投给我的书吧。<br /><br />

		</code>
		 */
		.replace(PATTERN_app_1, '')

		.replace(
		/**
		 * <code>

		// https://www.piaotian.com/html/14/14229/9821798.html	修仙三百年突然发现是武侠 第一百七十七章 巨大收获，火龙至天合
		&nbsp;&nbsp;&nbsp;&nbsp;【话说，目前朗读听书最好用的app，， 安装最新版。】<br/><br/>

		// http://www.shuhuang.la/xs/353/353456/5083138.html	第876章 不怂不行
		<br />　　【话说，目前朗读听书最好用的app，换源app，www.huanyuanapp.com安装最新版。】<br />

		</code>
		 */
		/(?:&nbsp;|　)*【话说，目前朗读听书最好用的app[^<>]{0,50}(?:<br\s*\/?>)+/g
		// 整行抽掉
		, '')

		/**
		 * <code>

		// https://www.ptwxz.com/html/14/14951/10288410.html	我在修仙界长生不死 第二百八十四章 元婴道君
		&nbsp;&nbsp;&nbsp;&nbsp;<a id="wzsy" href="http://m.xiaoshuting.info">小书亭</a><br /><br />

		// https://www.doupocangq.com/jianlai/172311_2.html	第一千零六十一章 假无敌真无敌(2)
		<p>id=wzsy></a></p>

		</code>
		 */
		.replace(PATTERN_wzsy, function(all, a_attributes) {
			return a_attributes.includes('id="wzsy"') ? '' : all;
		})

		/**
		 * <code>

		// https://www.ptwxz.com/html/14/14741/10229293.html	大乘期才有逆袭系统 第五百七十八章 音律秘境
		也只有她，意志力坚定，不为所动，没有受到影响。uu看书 www.uukanshu.com<br /><br />

		// https://www.ptwxz.com/html/14/14741/10229295.html	大乘期才有逆袭系统 第五百八十章 唱歌
		各有特色的演唱在此地上演，uu看书www.uukanshu.com 能看出组队的两人都可以配合对方。

		// https://www.ptwxz.com/html/14/14741/10236146.html	大乘期才有逆袭系统 第五百八十一章 乐器
		玉隐拉弓，uu看书 www.uukanshu.com 眼神锐利，

		// https://www.ptwxz.com/html/14/14951/10234904.html	我在修仙界长生不死 第二百六十七章 龙血武者
		，uu看书 <a href="http://www.uukanshu.com" target="_blank" class="linkcontent">www.uukanshu.com</a> 根本

		</code>
		 */
		.replace(/uu看书 *(?:<a(?:\s[^<>]*)*>)?www\.uukanshu\.com(?:<\/a>)? */g,
				'')

		// 一品修仙 正文 第二四三章 我不是幻觉，不信你捅我一剑试试
		// https://www.ptwxz.com/html/9/9503/6476110.html
		// 一品修仙 正文 第三六四章 黎族的大佬套路深，还没动手他就快完蛋了
		// https://www.ptwxz.com/html/9/9503/6750266.html
		// <br /><br />&nbsp;&nbsp;&nbsp;&nbsp;https:
		// <br /><br />&nbsp;&nbsp;&nbsp;&nbsp;天才本站地址：。m.
		// .replace('https:<br', '<br').replace('天才本站地址：。m.', '')
		;
		// console.log(text);

		// TODO: https://www.ptwxz.com/html/14/14951/10203091.html
		// &nbsp;&nbsp;&nbsp;&nbsp;一秒记住ｈｔｔｐs://.\nvip<br /><br />

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
