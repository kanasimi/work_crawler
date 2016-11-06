/**
 * 批量下載腾讯漫画的工具。 Download qq comics.
 * 
 * TODO: http://www.chuiyao.com/
 * 
 * @see https://github.com/abcfy2/getComic
 * 
 * @since 2016/10/30 21:40:6
 * @since 2016/11/1 23:15:16 正式運用。
 */

'use strict';

try {
	// Load CeJS library.
	require('cejs');

} catch (e) {
	// ----------------------------------------------------------------------------
	// Load CeJS library. For node.js loading.
	// Copy/modified from "/_for include/node.loader.js".
	'D:\\USB\\cgi-bin\\lib\\JS'
	// 載入泛用（非特殊目的使用）之功能。
	.split('|').some(function(path) {
		if (path.charAt(0) === '#') {
			// path is a comment
			return;
		}
		try {
			// accessSync() throws if any accessibility checks fail, and does
			// nothing otherwise.
			require('fs').accessSync(path);
			var loader = '/_for include/node.loader.js';
			require(path + (path.indexOf('/') !== -1 ? loader
			//
			: loader.replace(/\//g, '\\')));
			return true;
		} catch (e) {
		}
	});

	if (typeof CeL !== 'function') {
		// No CeJS library.
		throw '請先安裝 CeJS library:\nnpm install cejs';
	}
}

// ----------------------------------------------------------------------------
// Load module.

CeL.run([
// for .between()
'data.native',
// for CeL.to_file_name()
'application.net',
// for CeL.get_URL()
'application.net.Ajax',
// for CeL.env.arg_hash, CeL.fs_mkdir()
'application.platform.nodejs',
// for HTML_to_Unicode()
'interact.DOM' ]);

// ----------------------------------------------------------------------------

// console.log(process.argv)

var base_URL = 'http://ac.qq.com/',
//
main_directory = process.mainModule.filename.match(/[^\\\/]+$/)[0].replace(
		/\.js$/i, ''),
//
work_id = CeL.env.arg_hash && (CeL.env.arg_hash.title || CeL.env.arg_hash.id)
		|| process.argv[2],
//
MESSAGE_RE_DOWNLOAD = '下載出錯了，請確認排除錯誤或不再持續後，重新執行以接續下載。';

if (!work_id) {
	CeL.log('Usage:\nnode ' + main_directory + ' "work title / work id"\nnode '
			+ main_directory + ' "l=work list file"');
	process.exit();
}

// 腾讯TT浏览器
CeL.get_URL.default_user_agent = 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; TencentTraveler 4.0)';

// prepare directory
CeL.fs_mkdir(main_directory += '/');

start_operation();

// ----------------------------------------------------------------------------

function start_operation() {

	if (work_id.startsWith('l=')) {
		// e.g.,
		// node qq_comic.js l=qq.txt
		// @see http://ac.qq.com/Rank/comicRank
		var next_index = 0, work_count = 0,
		//
		work_list = (CeL.fs_read(work_id.slice('l='.length)) || '').toString()
				.replace(/\/\*[\s\S]*?\*\//g, '').trim().split('\n');
		function get_next_work() {
			if (next_index === work_list.length) {
				CeL.log('All ' + work_list.length + ' works done.');
				return;
			}
			var work_title = work_list[next_index++].trim();
			if (work_title && !work_title.startsWith('#')) {
				work_count++;
				CeL.log('Download ' + work_count
						+ (work_count === next_index ? '' : '/' + next_index)
						+ '/' + work_list.length + ': ' + work_title);
				get_work(work_title, get_next_work);
			} else {
				get_next_work();
			}
		}
		get_next_work();

	} else {
		// e.g.,
		// node qq_comic.js 12345
		// node qq_comic.js ABC
		get_work(work_id);
	}

}

// ----------------------------------------------------------------------------

function get_work(work_title, callback) {
	// 先取得 work id
	if (work_title > 0) {
		// is work id
		get_work_data(work_title, callback);
		return;
	}

	var search_result_file = main_directory + 'search.json',
	// search cache
	// 檢查看看之前是否有取得過。
	search_result = CeL.get_JSON(search_result_file) || CeL.null_Object();
	if (search_result[work_title = work_title.trim()]) {
		CeL.log('Find cache: ' + work_title + '→'
				+ JSON.stringify(search_result[work_title]));
		get_work_data(search_result[work_title], callback);
		return;
	}

	CeL.get_URL(base_URL + 'Comic/searchList/search/'
	// e.g., 找不到"隔离带 2"，須找"隔离带"。
	+ encodeURIComponent(work_title.replace(/\s+\d+$/, '')), function(XMLHttp) {
		var html = XMLHttp.responseText, matched, PATTERN_work_id =
		//
		/\/comicInfo\/id\/(\d+)(?:" title="([^"]+)")?/g,
		//
		ids = CeL.null_Object();
		while (matched = PATTERN_work_id.exec(html)) {
			ids[matched[1]] = matched[2] || true;
		}
		var id_list = Object.keys(ids);
		if (id_list.length === 1) {
			id_list = id_list[0];
		} else {
			CeL.err('[' + work_title + ']: Get ' + id_list.length + ' works: '
			//
			+ JSON.stringify(ids));
			if (id_list.every(function(id) {
				// 找看看是否有完全相同的。
				if (ids[id] !== work_title) {
					return true;
				}
				id_list = id;
			})) {
				return;
			}
		}
		// 已確認僅找到唯一id。
		search_result[work_title] = id_list | 0;
		// write cache
		CeL.fs_write(search_result_file, search_result);
		get_work_data(id_list, callback);
	});
}

function get_label(html) {
	return CeL.HTML_to_Unicode(html.replace(/<[^<>]+>/g, ''));
}

function get_work_data(work_id, callback, error_count) {
	CeL.get_URL(base_URL + 'Comic/comicInfo/id/' + (work_id |= 0), function(
			XMLHttp) {
		// console.log(XMLHttp);
		var html = XMLHttp.responseText;
		if (!html) {
			CeL.err('Failed to get work data of ' + work_id);
			if (error_count > 4) {
				throw MESSAGE_RE_DOWNLOAD;
			}
			error_count = (error_count | 0) + 1;
			CeL.log('Retry ' + error_count + '...');
			get_work_data(work_id, callback, error_count);
			return;
		}

		var matched,
		// work_data={id,title,author,authors,chapter_count,last_update,last_download:{date,chapter}}
		work_data = {
			// 必要屬性：須配合網站平台更改
			title : get_label(html.between(
					'<h2 class="works-intro-title ui-left">', '</h2>')),

			// 選擇性屬性：須配合網站平台更改
			author : CeL.HTML_to_Unicode(html.between('"works-author-name"',
					'>').between(' title="', '"')),
			authors :
			//
			get_label(html.between('<p class="bear-p-xone">', '</p>')),
			description : html.between('<meta name="Description" content="',
					'"'),
			last_update : get_label(html.between(
					'<span class="ui-pl10 ui-text-gray6">', '</span>')),

			// 自動添加之作業用屬性：
			id : work_id,
			last_download : {
				date : (new Date).toISOString(),
				chapter : 1
			}
		};

		process.title = '下載' + work_data.title;
		work_data.directory_name = CeL.to_file_name(work_data.id + ' '
				+ work_data.title);
		work_data.directory = main_directory + work_data.directory_name + '/';
		work_data.data_file = work_data.directory + work_data.directory_name
				+ '.json';

		matched = main_directory + 'cache/';
		CeL.fs_mkdir(matched);
		CeL.fs_write(matched + work_data.directory_name + '.htm', html);

		matched = CeL.get_JSON(work_data.data_file);
		if (matched) {
			// 基本上以新資料為準，除非無法取得新資料，才改用舊資料。
			for ( var key in matched) {
				if (!work_data[key]) {
					work_data[key] = matched[key];
				} else if (typeof work_data[key] !== 'object'
						&& work_data[key] !== matched[key]) {
					CeL.log(key + ': ' + matched[key]
					// 對比兩者。
					+ '\n→ ' + work_data[key]);
				}
			}
			matched = matched.last_download.chapter;
			if (matched > 1) {
				// 起始下載的start_chapter章节
				work_data.last_download.chapter = matched;
			}
		}

		// reset chapter_count. 此處 chapter (章節) 指的為平台所給的id編號，並非"回"、"話"！且可能會跳號！
		work_data.chapter_count = 0;
		// [ , chapter_id ]
		var PATTERN_chapter_id = /\/cid\/(\d{1,4})/g;
		while (matched = PATTERN_chapter_id.exec(html)) {
			// 取最大者。
			if (work_data.chapter_count < (matched = +matched[1])) {
				work_data.chapter_count = matched;
			}
		}
		if (work_data.chapter_count >= 1) {
			CeL.log(work_data.id + ' ' + work_data.title + ': '
			//
			+ work_data.chapter_count + ' chapters.'
			//
			+ (work_data.last_download.chapter > 1 ? ' 自章節編號第 '
			//
			+ work_data.last_download.chapter + ' 接續下載。' : ''));
			CeL.fs_mkdir(work_data.directory);
			CeL.fs_write(work_data.data_file, work_data);
			// 開始下載
			get_chapter_data(work_data, work_data.last_download.chapter,
					callback);
			return;
		}
		CeL.err(work_data.title + ': Can not get chapter counts!');
	});
}

// ----------------------------------------------------------------------------

function get_chapter_data(work_data, chapter, callback) {

	// decode chapter data
	// modify from
	// http://ac.gtimg.com/media/js/ac.page.chapter.view_v2.3.5.js?v=20160826
	function decode(c) {
		c = c.substring(1);

		var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", a = "", b, d, h, f, g, e = 0;
		for (c = c.replace(/[^A-Za-z0-9\+\/\=]/g, ""); e < c.length;) {
			b = _keyStr.indexOf(c.charAt(e++));
			d = _keyStr.indexOf(c.charAt(e++));
			f = _keyStr.indexOf(c.charAt(e++));
			g = _keyStr.indexOf(c.charAt(e++));
			b = b << 2 | d >> 4;
			d = (d & 15) << 4 | f >> 2;
			h = (f & 3) << 6 | g;
			a += String.fromCharCode(b);
			64 != f && (a += String.fromCharCode(d));
			64 != g && (a += String.fromCharCode(h));
		}
		c = a;
		for (var a = "", b = 0, c1, c2, d = c1 = c2 = 0; b < c.length;) {
			d = c.charCodeAt(b);
			if (128 > d) {
				a += String.fromCharCode(d);
				b++;
			} else if (191 < d && 224 > d) {
				c2 = c.charCodeAt(b + 1);
				a += String.fromCharCode((d & 31) << 6 | c2 & 63);
				b += 2;
			} else {
				c2 = c.charCodeAt(b + 1);
				c3 = c.charCodeAt(b + 2);
				a += String.fromCharCode((d & 15) << 12 | (c2 & 63) << 6 | c3
						& 63);
				b += 3;
			}
		}

		return JSON.parse(a);
	}

	var url = base_URL + 'ComicView/index/id/' + work_data.id + '/cid/'
			+ chapter, left, image_list, waiting;
	CeL.debug(work_data.id + ' ' + work_data.title + ' #' + chapter + '/'
			+ work_data.chapter_count + ': ' + url);
	process.title = chapter + ' @ ' + work_data.title;

	function get_data() {
		process.stdout.write('Get data of chapter ' + chapter + '...\r');
		CeL.get_URL(url, function(XMLHttp) {
			var html = XMLHttp.responseText;
			if (!html) {
				CeL.err('Failed to get chapter data of ' + work_data.directory
						+ chapter);
				if (get_data.error_count > 4) {
					throw MESSAGE_RE_DOWNLOAD;
				}
				get_data.error_count = (get_data.error_count | 0) + 1;
				CeL.log('Retry ' + get_data.error_count + '...');
				get_data();
				return;
			}

			var chapter_data = html.match(/\sDATA\s*=\s*'([^']{9,})'/);
			if (!chapter_data || !(chapter_data = decode(chapter_data[1]))
			//
			|| !chapter_data.picture
					|| !(left = chapter_data.picture.length) >= 1) {
				CeL.debug(work_data.directory_name + ' #' + chapter + '/'
						+ work_data.chapter_count + ': No image get.');
				// 模擬已經下載完最後一張圖。
				left = 1;
				check_if_done();
				return;
			}
			// console.log(chapter_data);

			var chapter_label = chapter.pad(4)
					+ (chapter_data.chapter.cTitle ? ' '
					//
					+ CeL.to_file_name(
					//
					CeL.HTML_to_Unicode(chapter_data.chapter.cTitle)) : ''),
			//
			chapter_directory = work_data.directory + chapter_label + '/';
			CeL.fs_mkdir(chapter_directory);
			CeL.fs_write(chapter_directory + work_data.directory_name + '-'
					+ chapter_label + '.htm', html);
			CeL.log(chapter + '/' + work_data.chapter_count
			//
			+ ' [' + chapter_label + '] ' + left + ' images.');

			image_list = chapter_data.picture;
			// console.log(image_list);
			// TODO: 當某 chapter 檔案過多，將一次 request 過多 connects 而造成問題。
			image_list.forEach(function(image_data, index) {
				// http://stackoverflow.com/questions/245840/rename-files-in-sub-directories
				// for /r %x in (*.jfif) do ren "%x" *.jpg

				// file_path
				image_data.file = chapter_directory + work_data.id + '-'
						+ chapter + '-' + (index + 1).pad(3) + '.jpg';
				get_images(image_data, check_if_done);
			});
			// 已派發完工作，開始等待。
			waiting = true;
		}, null, null, {
			timeout : 30 * 1000
		});
	}
	get_data();

	function check_if_done() {
		--left;
		process.stdout.write(left + ' left...\r');
		// 須注意若是最後一張圖get_images()直接 return 了，此時尚未設定 waiting，因此此處不可以 waiting 判斷！
		if (left > 0) {
			// 還有尚未取得的檔案。
			if (waiting && left < 2) {
				CeL.debug('Waiting for: '
				//
				+ image_list.filter(function(image_data) {
					return !image_data.OK;
				}).map(function(image_data) {
					return image_data.url + '\n→ ' + image_data.file;
				}));
			}
			return;
		}
		// assert: left===0

		// 已下載完本chapter
		work_data.last_download.chapter = chapter;
		// 紀錄已下載完之chapter
		CeL.fs_write(work_data.data_file, work_data);
		if (++chapter > work_data.chapter_count) {
			CeL.log(work_data.directory_name + ' done.');
			if (typeof callback === 'function') {
				callback(work_data);
			}
			return;
		}
		get_chapter_data(work_data, chapter, callback);
	}
}

var node_fs = require('fs');

function get_images(image_data, callback) {
	// console.log(image_data);
	if (node_fs.existsSync(image_data.file)) {
		image_data.OK = true;
		callback();
		return;
	}

	CeL.get_URL(image_data.url, function(XMLHttp) {
		var contents = XMLHttp.responseText;
		// 80: 應改成最小容許圖案大小。
		if (contents && contents.length > 80
		// http://stackoverflow.com/questions/4585527/detect-eof-for-jpg-images
		&& contents[contents.length - 2] === 255
		// When you get to FFD9 you're at the end of the stream.
		&& contents[contents.length - 1] === 217) {
			image_data.OK = true;
			CeL.fs_write(image_data.file, contents);
			callback();
			return;
		}

		CeL.err('Failed to get ' + image_data.url + '\n→ ' + image_data.file);
		if (image_data.error_count > 4) {
			throw MESSAGE_RE_DOWNLOAD;
		}

		image_data.error_count = (image_data.error_count | 0) + 1;
		CeL.log('Retry ' + image_data.error_count + '...');
		get_images(image_data, callback);

	}, 'binary', null, {
		timeout : 20 * 1000
	});
}
