/**
 * 批量下载腾讯漫画的工具。 Download qq comics.
 * 
 * @see https://github.com/abcfy2/getComic
 * 
 * @since 2016/10/30 21:40:6
 * @since 2016/11/1 23:15:16 正式運用。
 */

'use strict';

// ----------------------------------------------------------------------------
// Load CeJS library. For node.js loading.
// Copy/modified from "/_for include/node.loader.js".
'../../lib/JS'
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
		|| process.argv[2];

if (!work_id) {
	CeL.log('Usage:\nnode ' + main_directory + ' "work title / work id"\nnode '
			+ main_directory + ' "l=work list file"');
	process.exit();
}

// 腾讯TT浏览器
CeL.get_URL.default_user_agent = 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; TencentTraveler 4.0)';

// prepare directory
CeL.fs_mkdir(main_directory += '/');

if (work_id.startsWith('l=')) {
	// e.g.,
	// node qq_comic.js l=qq.txt
	// @see http://ac.qq.com/Rank/comicRank
	var next_index = 0, work_count = 0,
	//
	work_list = CeL.fs_read(work_id.slice(2)).toString().trim().split('\n');
	function get_next_work() {
		if (next_index === work_list.length) {
			CeL.log('All ' + work_list.length + ' works done.');
			return;
		}
		var work_title = work_list[next_index++].trim();
		if (work_title && !work_title.startsWith('#')) {
			work_count++;
			CeL.log('Download ' + work_count
					+ (work_count === next_index ? '' : '/' + next_index) + '/'
					+ work_list.length + ': ' + work_title);
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
		CeL.log('Find cache: ' + work_title + '→' + search_result[work_title]);
		get_work_data(search_result[work_title], callback);
		return;
	}

	CeL.get_URL(base_URL + 'Comic/searchList/search/'
			+ encodeURIComponent(work_title), function(XMLHttp) {
		var html = XMLHttp.responseText, matched, PATTERN_work_id =
		//
		/\/comicInfo\/id\/(\d+)(?:" title="([^"]+)")?/g,
		//
		ids = CeL.null_Object();
		while (matched = PATTERN_work_id.exec(html)) {
			ids[matched[1]] = matched[2] || true;
		}
		var id_list = Object.keys(ids);
		if (id_list.length !== 1) {
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
		} else {
			id_list = id_list[0];
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

function get_work_data(work_id, callback) {
	CeL.get_URL(base_URL + 'Comic/comicInfo/id/' + (work_id |= 0), function(
			XMLHttp) {
		// console.log(XMLHttp);
		var html = XMLHttp.responseText,
		//
		matched, PATTERN_chapter_id = /\/cid\/(\d+)/g,
		// work_data={id,title,author,authors,chapters,last_update,last_download:{date,chapter}}
		work_data = {
			id : work_id,
			title : get_label(html.between(
					'<h2 class="works-intro-title ui-left">', '</h2>')),
			author : CeL.HTML_to_Unicode(html.between('"works-author-name"',
					'>').between(' title="', '"')),
			authors :
			//
			get_label(html.between('<p class="bear-p-xone">', '</p>')),
			description : html.between('<meta name="Description" content="',
					'"'),
			last_update : get_label(html.between(
					'<span class="ui-pl10 ui-text-gray6">', '</span>')),
			last_download : {
				date : (new Date).toISOString(),
				chapter : 1
			}
		};

		work_data.directory_name = CeL.to_file_name(work_data.id + ' '
				+ work_data.title);
		work_data.directory = main_directory + work_data.directory_name + '/';
		work_data.data_file = work_data.directory + work_data.directory_name
				+ '.json';

		matched = main_directory + 'cache/';
		CeL.fs_mkdir(matched);
		CeL.fs_write(matched + work_id + '.htm', html);

		matched = CeL.get_JSON(work_data.data_file);
		if (matched) {
			// 基本上以新資料為準，除非無法取得新資料，才改用舊資料。
			for ( var key in matched) {
				if (!work_data[key]) {
					work_data[key] = matched[key];
				} else if (typeof work_data[key] !== 'object'
						&& work_data[key] !== matched[key]) {
					// 對比兩者。
					CeL.log(key + ': ' + matched[key] + '→' + work_data[key]);
				}
			}
			matched = matched.last_download.chapter;
			if (matched > 1) {
				// 起始下載的start_chapter章节
				work_data.last_download.chapter = matched;
			}
		}

		// reset
		work_data.chapters = 0;
		while (matched = PATTERN_chapter_id.exec(html)) {
			// 取最大者。
			if (work_data.chapters < (matched = +matched[1])) {
				work_data.chapters = matched;
			}
		}
		if (work_data.chapters >= 1) {
			CeL.log(work_data.id + ' ' + work_data.title + ': '
			//
			+ work_data.chapters + ' chapters.'
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

	// modify from
	// http://ac.gtimg.com/media/js/ac.page.chapter.view_v2.3.5.js?v=20160826
	// usage:
	// JSON.parse(decode(DATA.substring(1)));
	function decode(c) {
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
		return a;
	}

	var url = base_URL + 'ComicView/index/id/' + work_data.id + '/cid/'
			+ chapter, left;
	CeL.debug(work_data.id + ' ' + work_data.title + ' #' + chapter + '/'
			+ work_data.chapters + ': ' + url);
	process.title = chapter + ' @ ' + work_data.title;

	CeL.get_URL(url, function(XMLHttp) {
		var html = XMLHttp.responseText;
		if (!html) {
			throw 'Failed to get chapter data of ' + work_data.directory
					+ chapter;
			// 若是下載出錯，重新執行即可接續下載。
		}
		var data = html.match(/\sDATA\s*=\s*'([^']{9,})'/);
		if (!data || !(data = JSON.parse(decode(data[1].substring(1))))
		//
		|| !data.picture || !(left = data.picture.length) >= 1) {
			CeL.debug(work_data.directory_name + ' #' + chapter + '/'
					+ work_data.chapters + ': No picture get.');
			// 模擬已經下載完最後一張圖。
			left = 1;
			check_if_done();
			return;
		}
		var chapter_label = chapter.pad(4) + (data.chapter.cTitle ? ' '
		//
		+ CeL.to_file_name(
		//
		CeL.HTML_to_Unicode(data.chapter.cTitle)) : ''),
		//
		chapter_directory = work_data.directory + chapter_label + '/';
		CeL.fs_mkdir(chapter_directory);
		CeL.fs_write(chapter_directory + work_data.directory_name + '-'
				+ chapter_label + '.htm', html);
		CeL.log(chapter + '/' + work_data.chapters
		//
		+ ' [' + chapter_label + '] ' + left + ' pictures.');
		// console.log(data.picture);
		data.picture.forEach(function(picture_data, index) {
			// http://stackoverflow.com/questions/245840/rename-files-in-sub-directories
			// for /r %x in (*.jfif) do ren "%x" *.jpg
			get_images(picture_data, chapter_directory + work_data.id + '-'
					+ chapter + '-' + (index + 1).pad(3) + '.jpg',
					check_if_done);
		});
	});

	function check_if_done() {
		if (--left > 0) {
			return;
		}
		// assert: left===0

		// 已下載完本chapter
		work_data.last_download.chapter = chapter;
		// 紀錄已下載完之chapter
		CeL.fs_write(work_data.data_file, work_data);
		if (++chapter > work_data.chapters) {
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

function get_images(picture_data, file_path, callback) {
	// console.log(picture_data);
	if (node_fs.existsSync(file_path)) {
		callback();
		return;
	}
	CeL.get_URL(picture_data.url, function(XMLHttp) {
		var contents = XMLHttp.responseText;
		if (contents) {
			CeL.fs_write(file_path, contents);
		} else {
			throw 'Failed to get ' + picture_data.url + '\nto ' + file_path;
			// 若是下載出錯，重新執行即可接續下載。
		}
		callback();
	}, 'binary');
}
