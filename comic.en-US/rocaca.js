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

	// one_by_one : true,
	base_URL : 'http://www.rocaca.com/',

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
				var title = get_label(html.between(' selected>', '</option>'));
				if (title) {
					chapter_data.title = title;
				}
			}
			if (chapter_data.title) {
				chapter_data.title = chapter_data.title.replace(
						work_data.title, '');
			}
		}

		var imgsrcs = html.match(/var\s+imgsrcs\s*=\s*'([^']+)'/);
		imgsrcs = decode_function(imgsrcs[1]);

		chapter_data.image_list = imgsrcs.map(function(url) {
			return {
				url : url
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

var chapter_init_filename = 'js/chapter_init.js?47', chapter_filename = 'js/chapter.js?47',
//
decode_function = 'decode_function=function(imgsrcs){'
		+ 'var window={},navigator={},jQuery={},current_page=1,_a,__micro,__renderedImg,$j,$i,$temp,_eu;'
		+ 'function atob(a){return new Buffer.from(a,"base64").toString("binary");}';

CeL.get_URL_cache(crawler.base_URL + chapter_init_filename,
		get_chapter_filename, crawler.main_directory
				+ chapter_init_filename.match(/[^\\\/]+$/)[0].replace(/\?.*/,
						''));

function get_chapter_filename(contents) {
	decode_function += contents;
	CeL.get_URL_cache(crawler.base_URL + chapter_filename,
			patch_decoder_and_start_crawler, crawler.main_directory
					+ chapter_filename.match(/[^\\\/]+$/)[0]
							.replace(/\?.*/, ''));
}

function patch_decoder_and_start_crawler(contents_2) {
	contents_2 = contents_2
	// patch
	.replace("jQuery(window)[_0x48a8('0x0','Uqv8')]", '').replace(
			'_0x22d855(_0xfc6db5)',
			'typeof _0x22d855==="function"&&_0x22d855(_0xfc6db5)').replace(
			'_0x20ab1c=new Array();',
			'_0x20ab1c=new Array();imgsrcs=_0x20ab1c;return;');

	[ "_0x60bcf4[_0x48a8('0x98',", "_0x60bcf4[_0x48a8('0x9d',",
			"_0x60bcf4[_0x48a8('0xa3',", "manga_name=", "chapter_name=",
			"_0xc1b57a[_0x48a8('0x291',", "jQuery[_0x48a8('0x29b',",
			"if(_0xc1b57a[_0x48a8('0x25d','XSHH')](window" ].forEach(function(
			token) {
		contents_2 = contents_2.replace(token, (token.endsWith('=')
				|| token.startsWith('if') ? 'if(0)' : '0&&')
				+ token);
	});

	decode_function += contents_2 + 'return imgsrcs;}';
	eval(decode_function);

	start_crawler(crawler, typeof module === 'object' && module);
}
