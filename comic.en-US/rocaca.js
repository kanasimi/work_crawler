/**
 * 批量下載 Rocaca 的工具。 Download rocaca comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var PATTERN_chapter = /<tr>[\s\S]+?<a [^<>]*?href="([^<>"]+)">([\s\S]+?)<\/a>[\s\S]+?<td class="no">([\s\S]+?)<\/td>/g,
//
crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 循序逐個、一個個下載圖像。僅對漫畫有用，對小說無用。小說章節皆為逐個下載。 Download images one by one.
	// 若設成{Natural}大於零的數字(ms)或{String}時間長度，那會當成下載每張圖片之時間間隔。
	//
	// 2018/9/25: Rocaca 不允許過於頻繁的 access，Cloudflare 會給出 403 錯誤。
	// 3s: 下載20張圖就會出403
	// Server: cloudflare
	one_by_one : '4s',

	base_URL : 'http://www.rocaca.com/',

	// chapter_time_interval : '1s',

	// 規範 work id 的正規模式；提取出引數（如 URL）中的作品id 以回傳。
	extract_work_id : function(work_information) {
		return /^[a-z_\-\d]+$/.test(work_information) && work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'search/?name=',
	parse_search_result : function(html, get_label) {
		html = html.between('<div class="search-list">').between('<ul>',
				'</ul>');

		var id_list = [], id_data = [],
		//
		PATTERN = /<li>([\s\S]+?)<\/li>/g, matched;

		while (matched = PATTERN.exec(html)) {
			matched = matched[1].match(
			//
			/<a [^<>]*?href="([^<>"]+)"[^<>]*? title="([^<>"]+)"/);
			var id = matched[1].match(/\/manga\/(.+)\/$/),
			//
			title = get_label(matched[2]);
			if (title && id && (id = id[1])) {
				id_list.push(id);
				id_data.push(title);
			}
		}

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'manga/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		var text = html.between('<div class="cartoon-intro">', '<script'),
		//
		work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1>', '</h1>'))

		// 選擇性屬性：須配合網站平台更改。
		// <meta property="og:novel:status" content="已完结"/>
		};
		extract_work_data(work_data, text,
				/<p>\s*<span>([^<>]+)<\/span>([\s\S]+?)<\/p>/g);
		work_data.Status = work_data.Status.replace(/RSS/, '').trim();
		Object.assign(work_data, {
			author : work_data.Author,
			status : work_data.Status,
			note : get_label(html.between('<div class="mod-msg msg-tips">',
					'</div>')),
			last_update : work_data.Update
		});

		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between(' id="chapter_list1">', '</table>');

		var matched;
		work_data.chapter_list = [];

		while (matched = PATTERN_chapter.exec(html)) {
			var chapter_data = {
				title : get_label(matched[2]),
				url : matched[1],
				date : get_label(matched[3]),
			};
			work_data.chapter_list.unshift(chapter_data);
		}
		// console.log(work_data.chapter_list);
		// CeL.set_debug(3);
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		eval(('0,current_chapter' + html.between('<script>var current_chapter',
				'</script>').replace(/,curl\s*=[^,]+/, '')).replace(/,/g,
				',chapter_data.'));

		// 有時可能 chapter_name=""
		if (chapter_data.chapter_name) {
			chapter_data.title = chapter_data.chapter_name;
		} else {
			if (!chapter_data.title) {
				// Ch.1 has NO ' selected>'
				chapter_data.title = get_label(html.between(' selected>',
						'</option>'));
			}
			// assert: !!chapter_data.title === true
			chapter_data.title = chapter_data.title
					.replace(work_data.title, '');
		}

		var imgsrcs = html.match(/var\s+imgsrcs\s*=\s*'([^']+)'/);
		// console.log(imgsrcs);
		imgsrcs = decode_function(imgsrcs[1]);
		// console.log(imgsrcs);

		chapter_data.image_list = imgsrcs.map(function(url) {
			return {
				url : url,
				acceptable_types : [ 'jpg', 'jpeg' ]
			};
		});

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

setup_crawler(crawler, typeof module === 'object' && module);

// 創建 main directory。
CeL.create_directory(crawler.main_directory);

var chapter_init_filename = 'js/chapter_init.js?52', chapter_filename = 'js/chapter.js?52',
//
decode_function = 'decode_function=function(imgsrcs){'
		+ 'var window={},document={},navigator={},jQuery=function(){return{}},current_page=1,_a,__micro,__renderedImg,$j,$i,$temp,_eu;';

CeL.get_URL_cache(crawler.base_URL + chapter_init_filename,
		get_chapter_filename, crawler.main_directory
				+ chapter_init_filename.match(/[^\\\/]+$/)[0].replace(/\?.*/,
						''));

function get_chapter_filename(contents, error) {
	decode_function += contents;
	CeL.get_URL_cache(crawler.base_URL + chapter_filename,
			patch_decoder_and_start_crawler, crawler.main_directory
					+ chapter_filename.match(/[^\\\/]+$/)[0]
							.replace(/\?.*/, ''));
}

function patch_decoder_and_start_crawler(contents_2, error) {
	if (false) {
		console
				.log(contents_2
						.match(/jQuery\(window\)\[_0x[\da-f]{4}\('0x0','[^']{4}'\)\]/g));
		console
				.log(contents_2
						.match(/function _0x[\da-f]{6}\((_0x[\da-f]{6}),(_0x[\da-f]{6})\){return \1\(\2\);?}/g));
		console
				.log(contents_2
						.match(/(}else _0x[\da-f]{6}=new Array\(\);)continue;(case')/g));
		console.log(contents_2.match(/jQuery\[_0x[\da-f]{4}\([^()]+\)\]\(/g));

		// 去掉 try{}catch(){} 以揭露錯誤。
		contents_2 = contents_2.replace("try{", "{").replace(
				/}catch\([^()]+\)/, "}if(0)");
	}

	// Rocaca 2018/8/5 改版。

	// patch code
	contents_2 = contents_2
	// window.ready, 會得到1個結果
	// 47: jQuery(window)[_0x48a8('0x0','Uqv8')]
	// 52: jQuery(window)[_0xc24f('0x0', 'iF0[')]
	.replace(/jQuery\(window\)\[_0x[\da-f]{4}\('0x0','[^']{4}'\)\]/, '')
	// 執行函數用的 wapper
	// 47: function _0x3acd60(_0x22d855,_0xfc6db5){return
	// _0x22d855(_0xfc6db5);}
	.replace(/\((_0x[\da-f]{6}),(_0x[\da-f]{6})\){return \1\(\2\);?}/,
	// 可能會得到十幾個matched結果
	function(all, a1, a2) {
		return '(' + a1 + ',' + a2 + '){typeof ' + a1
		//
		+ '==="function"&&' + a1 + '(' + a2 + ')}';
	})
	// 解碼圖片網址列表之後，當沒辦法解碼時，給個初始值: []。應該得到1個結果
	// 47: break;}}else _0x20ab1c=new Array();continue;case'2':var
	.replace(/(}else (_0x[\da-f]{6})=new Array\(\);)continue;(case')/,
			function($0, $1, $2, $3) {
				// console.log([ $0, $1, $2, $3 ]);
				return $1 + 'imgsrcs=' + $2 + ';return;' + $3;
			})
	// 避免因為沒有此屬性而throw錯誤
	.replace(
	//
	/(?:jQuery|window)(?:\[_0x[\da-f]{4}\('[^']*'(?:,'[^']*')*\)\])+\(/g, "(")
	// will get jQuery(document)
	.replace(/\(jQuery,document\)/g, ';if(0)');

	decode_function += contents_2 + 'return imgsrcs;}';
	// console.log(decode_function.split('\n').length);
	// console.log(decode_function.split('\n')[5-1].length);
	// console.log(decode_function.split('\n')[5 - 1].slice(70000));
	eval(decode_function);

	start_crawler(crawler, typeof module === 'object' && module);
}
