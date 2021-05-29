/**
 * 批量下載 無限動漫 漫畫 的工具。 Download 8comic comics.
 * 
 * TODO: https://m.comicbus.com/data/search.aspx https://8book.com/
 * 
 * <code>


// 各章節頁面共通
// from https://www.comicbus.me/js/nview.js?20180806
var y=46;function lc(l){if(l.length!=2 ) return l;var az="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";var a=l.substring(0,1);var b=l.substring(1,2);if(a=="Z") return 8000+az.indexOf(b);else return az.indexOf(a)*52+az.indexOf(b);}function su(a,b,c){var e=(a+'').substring(b,b+c);return (e);}

function nn(n){return n<10?'00'+n:n<100?'0'+n:n;}function mm(p){return (parseInt((p-1)/10)%10)+(((p-1)%10)*3)};


// ch: chapter_NO
var ch='1'


// 各章節頁面共通
// from chapter_page
// p: image serial
var p=1;if(ch.indexOf('-')>0) {p=parseInt(ch.split('-')[1]);ch=ch.split('-')[0];}if(ch=='') ch=1;else ch=parseInt(ch);
var pi=ch;var ni=ch;var ci=0;var ps=0;

chapter_data={};
function ge(e){return chapter_data;}

// from chapter_page: 各章節頁面不同
var chs=59;var ti=13313;var cs='...';for(var i=0;i<59;i++){var uqtvi=lc(su(cs,i*y+0,2));var anebf= lc(su(cs,i*y+2,2));var pgeci= lc(su(cs,i*y+4,2));var kqasw= lc(su(cs,i*y+6,40));ps=pgeci;if(uqtvi== ch){ci=i;ge('TheImg').src='//img'+su(anebf, 0, 1)+'.8comic.com/'+su(anebf,1,1)+'/'+ti+'/'+uqtvi+'/'+ nn(p)+'_'+su(kqasw,mm(p),3)+'.jpg';pi=ci>0?lc(su(cs,ci*y-y+0,2)):ch;ni=ci<chs-1?lc(su(cs,ci*y+y+0,2)):ch;break;}}

// needless
var pt='[ '+pi+' ]';var nt='[ '+ni+' ]';spp();


// get url in chapter_data.src



https://m.comicbus.com/
使用的方法有些許不同

</code>
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

require('tls').DEFAULT_MIN_VERSION = 'TLSv1';

function extract_image_urls(XMLHttp, work_data) {
	// console.log(XMLHttp);
	var html = XMLHttp.responseText;
	// console.log(html);

	function add_image(site_chapter_NO, url) {
		// console.log([ chapter_NO, image_NO, url ]);
		var chapter_data = work_data.chapter_mapper[site_chapter_NO];
		if (!chapter_data)
			throw 'Do not has §' + site_chapter_NO;
		if (!Array.isArray(chapter_data.image_list))
			chapter_data.image_list = [];
		chapter_data.image_list.push(url);
	}

	html = 'var pi=ch;' + html.between('var pi=ch;', 'var pt=');

	// if(hyghv== ch){ci=i;ge('TheImg').src=
	html = html.replace(/if\(([a-z\d]+)== ch\)({ci=i;)/,
	// assert: (ch=$1) >= 1
	'if(ch=$1)$2')
	// Do not jump out.
	.replace(';break;', ';')
	// if(hyghv== ch){ci=i;ge('TheImg').src='//img'+su(slusb, 0,
	// 1)+'.8comic.com/'+su(slusb,1,1)+'/'+ti+'/'+hyghv+'/'+
	// nn(p)+'_'+su(xbvgf,mm(p),3)+'.jpg';
	.replace(/ge\([^()]+\)\.src=([^;]+)/, 'for(p=1;p<=ps;p++)add_image(ch,$1)');

	// {y,lc,su,nn,mm}: 各章節頁面共通
	// from https://www.comicbus.me/js/nview.js?20180806
	html = 'var ch,p,{y,lc,su,nn,mm}=decoder;' + html;

	// console.log(html);
	eval(html);

	// free
	delete work_data.chapter_mapper;
	// console.log(JSON.stringify(chapter_data));
}

// <td nowrap="nowrap" width="80"><img src="../images/bl.gif" width="17"
// height="16" hspace="6" align="absmiddle" />類別：</td>
// <td nowrap="nowrap"><a href='/comic/4-1.html'>戰國系列</a></td>
var PATTERN_work_data = /hspace="6" align="absmiddle" \/>([^<>：]+)：<\/td>([\s\S]*?)<\/td>/g;

var crawler = new CeL.work_crawler({
	// 當有多個分部的時候才重新檢查。
	recheck : 'multi_parts_changed',

	// 圖像檔案下載失敗處理方式：忽略/跳過圖像錯誤。當404圖像不存在、檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。default:false
	skip_error : true,

	// one_by_one : true,

	// 2019/6/28-2020/4/30: https://www.comicbus.com/
	// 2020/4/30 無限動漫 改變網址: https://comicbus.live/
	base_URL : 'https://comicbus.live/',
	charset : 'big5',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'member/search.aspx?k=',
	parse_search_result : function(html, get_label) {
		var
		// {Array}id_list = [ id, id, ... ]
		id_list = [],
		// {Array}id_data = [ title, title, ... ]
		id_data = [];

		html = html.between('搜尋結果');
		// console.log(html);

		html.each_between('<td width="100%" height="150" valign="top"',
		//
		'</tr>', function(token) {
			// console.log(token);
			var matched = token.match(
			//
			/<a href='\/html\/(\d+).html'[^<>]*>([\s\S]+?)<\/b>/);
			id_list.push(+matched[1]);
			id_data.push(get_label(matched[2]));
		});

		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'html/' + work_id + '.html';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		//
		html = html.between('<td height="35" bgcolor="#24a9e2">',
		// <table id="rp_tb_comic_0" width="100%" bgcolor="#F9F9F9" border="0"
		// align="center" cellpadding="0" cellspacing="0"
		// style="margin-bottom:20px">
		'<table id="rp_tb_comic_');

		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between(null, '</font>')),

		// 選擇性屬性：須配合網站平台更改。
		};

		extract_work_data(work_data, html, PATTERN_work_data);

		Object.assign(work_data, {
			author : work_data.作者,
			last_update : work_data.更新,

			description : get_label(html.between(
					'<td style="line-height:25px">', '</tr>'))
		});

		var matched = work_data.漫畫 && work_data.漫畫.match(/(完|連載中)$/);
		if (matched)
			work_data.status = matched[1];

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		// <div class="tabs1" style="height:30px; margin-top:0.8%;
		// margin-left:20px">
		// <table id="div_li1" width="100%" border="0" cellspacing="0"
		// cellpadding="0">
		html = html.between('<table id="div_li1"',
		// <table id="div_li2" class="hide" width="100%" border="0"
		// cellspacing="0" cellpadding="0">
		'<table id="div_li2"');

		work_data.chapter_list = [];
		work_data.chapter_mapper = [];

		var PATTERN_chapter =
		// matched: [ all, url arguments, ? 卷/話 ]
		/<a href='#' onclick="cview\(([^()]+)\)[^<>]*>([\s\S]+?)<\/a>/g;

		html.each_between('<table id="rp_ctl', '</table>',
		// for each part
		function(token) {
			var matched, part_title;
			while (matched = PATTERN_chapter.exec(token)) {
				// console.log(matched[0]);
				matched[2] = get_label(matched[2]);
				if (!part_title) {
					// e.g., 西遊 https://www.comicbus.com/13505.html
					// "001話 龍與狼","002話 龍王、神將"
					part_title = matched[2].match(/^\d+([^\d])(?:\s|$)/)
							|| matched[2].match(/([^\s])\s*$/);
					part_title = part_title[1];
					this.set_part(work_data, part_title);
				}
				var chapter_data = {
					title : matched[2],
					url : decoder.cview.apply(null, JSON.parse('['
							+ matched[1].replace(/'/g, '"') + ']'))
				};
				this.add_chapter(work_data, chapter_data);
				work_data.chapter_mapper[chapter_data.url
				//
				.match(/ch=(\d+)/)[1]] = chapter_data;
			}
		}.bind(this));

		// console.log(JSON.stringify(work_data.chapter_list));
		// console.log(work_data);
		// console.log(work_data.chapter_list[0]);
	},

	after_get_work_data
	// 必須自行保證執行 callback()，不丟出異常、中斷。
	: function(start_to_process_chapter_data, work_data) {
		this.get_URL(
		// 依照現在本網站的實作方法，無論是哪個章節都會取得相同的網頁，因此不必特別設定最後一個網頁。
		// work_data.chapter_list[work_data.chapter_list.length - 1].url
		work_data.chapter_list[0].url, function(XMLHttp) {
			extract_image_urls(XMLHttp, work_data);
			start_to_process_chapter_data();
		});
	},

	// 在 after_get_work_data() 時，就能分析出整個作品的圖片網址，因此不需要再取得每個章節。
	skip_get_chapter_page : true,

	// e.g., 4945 龍虎五世W
	trim_trailing_newline : true
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

setup_crawler(crawler, typeof module === 'object' && module);

// 創建 main directory。
CeL.create_directory(crawler.main_directory);

// https://www.comicbus.com/js/comicview.js?7684468929
var decoder = Object.create(null), url_converter_decode_filename = 'comicview.js',
// https://www.comicbus.me/js/nview.js?20180806
decode_filename = 'nview.js';
// console.log(crawler.base_URL + 'js/' + url_converter_decode_filename);
// console.log(crawler.main_directory + url_converter_decode_filename);

CeL.get_URL_cache(crawler.base_URL + 'js/' + url_converter_decode_filename,
//
function(contents, error) {
	// console.log(contents);
	contents = contents
			.replace(/window\.open\(([^(),]+),[^()]+\)/, 'return $1');
	// `getcookie=()=>3` 會擷取 "c-" 系列，但此系列網頁更新似乎較慢，有時會在獲取最新章節時會得不到圖片網址資料。
	contents = 'var getcookie=()=>0,getCookie=()=>0;' + contents
			+ ';decoder.cview=cview;';
	contents = contents.replace(/document\.location/g, '(' + JSON.stringify({
		href : crawler.base_URL
	}) + ')');
	eval(contents);

	CeL.get_URL_cache(crawler.base_URL + 'js/' + decode_filename,
			after_fetch_decode_file, crawler.main_directory + decode_filename);

}, crawler.main_directory + url_converter_decode_filename);

function after_fetch_decode_file(contents, error) {
	// include decode_file
	eval('var y=' + contents.between('var y=', '\n') + 'function nn('
			+ contents.between('function nn(', '\n')
			+ ';Object.assign(decoder,{y,lc,su,nn,mm});');

	start_crawler(crawler, typeof module === 'object' && module);
}
