/**
 * rename files downloaded.
 * 
 * e.g., abc.rar → 確実な名前.abc.rar
 * 
 * node renamer.js [category [directory]]
 * 
 * @since 2016/12/19 14:17:11 初版: files from nyaa<br />
 *        2017/5/4 20:18:3 files from AcgnX末日動漫資源庫<br />
 *        2017/5/18 20:32:19 files from http://nyaa.si/
 */

'use strict';

global.need_work_id = false;

require('./work_crawler_loder.js');

CeL.run(
// for HTML_to_Unicode()
'interact.DOM');

// ----------------------------------------------------------------------------

CeL.get_URL.default_user_agent = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36"
		+ Math.random();

// e.g., "node renamer.js C target_directory"
var target_directory = process.argv[3] || '.',
// reget === true: reget till no more new menu files.
// reget > 1: reget ALL menu list.
reget = 2,
//
category_name = /^H$/i.test(work_id) || /成年|Hcomic|noACG_H/i.test(work_id) ? 'Hcomic'
		: 'comic',
//
categories = {
	Hcomic : [ 'cache_sukebei', 'https://sukebei.nyaa.si/', '1_4', 100 ],
	comic : [ 'cache_nyaa', 'https://nyaa.si/', '3_3', 100 ]
},
//
category_config = categories[category_name],
//
base_directory = data_directory + category_config[0] + CeL.env.path_separator,
//
base_URL = category_config[1], category_NO = category_config[2], last_count = category_config[3];

CeL.fs_mkdir(base_directory);

var
// target_files[fso name] = path
target_files = CeL.null_Object(), target_directories = CeL.null_Object(),

cache_file = base_directory + 'data.json',
//
cache_data = CeL.get_JSON(cache_file),
// file / folder name
PATTERN_latin_fso_name = /^([\u0020-\u007F]+)(\.[a-z]+)?$/,
// [[en:Numerals_in_Unicode#Roman_numerals]]
PATTERN_full_latin_or_sign = /^[\u0020-\u00FF’★☆♥♡Ⅰ-ↈ①-⑳⑴-⑽㈠-㈩]+$/;

if (target_directory) {
	if (!/[\\\/]$/.test(target_directory)) {
		target_directory += CeL.env.path_separator;
	}

	CeL.traverse_file_system(target_directory, function(path, fso_status,
			is_directory) {
		if (is_directory) {
			target_directories[fso_status.name] = path;
		} else {
			target_files[fso_status.name] = path;
		}
	}, PATTERN_full_latin_or_sign, 1);

	if (CeL.is_empty_object(target_files)
			&& CeL.is_empty_object(target_directories)) {
		CeL.info('No target to rename.');
	} else {
		CeL.info('Rename ' + category_name + ' @ ' + target_directory + '\n'
				+ Object.keys(target_files).length + ' files, '
				+ Object.keys(target_directories).length
				+ ' directories to rename.');
	}
}

// CeL.set_debug(6);
get_menu_list();

// -------------------------------------------------------------------------------------------------

// for AcgnX末日動漫資源庫 HamotionCloud: DDOS Protection by Voxility.
// Cloudflare protection?
function check_reget(XMLHttp, options) {
	if (XMLHttp.status === 302) {
		return true;
	}
	var html = XMLHttp.responseText;
	if (html.includes('<title>302 Found</title>')) {
		return true;
	}
	if (html.includes('<body onLoad="javascript:jump()">')) {
		var key = html.between("setCookie('", "'"), value = html.between(
				"'cookie' : \"", '"');
		if (!key || !value) {
			throw 'Can not parse cookie!';
		}
		if (!options.headers) {
			options.headers = CeL.null_Object();
		}
		options.headers.Cookie = key + '=' + value;
		return true;
	}
}

var get_URL_options = {
	check_reget : check_reget
};

function get_menu_list(callback) {
	function for_menu_NO(run_next, index) {
		process.title = 'renamer ' + index + '/' + last_count;
		CeL.info('get_menu_list: menu ' + category_name + ' ' + index + '/'
				+ last_count);
		CeL.get_URL_cache(base_URL + '?c=' + category_NO + '&p=' + index,
				function(html, error, XMLHttp) {
					for_menu_list(html, function() {
						CeL.fs_write(cache_file, cache_data);
						if (reget && this.new_files === 0) {
							CeL.info('No more new menu files.');
						} else {
							CeL.info(this.new_files + ' new files.');
						}
						if (!reget || this.new_files > 0 || reget > 1) {
							run_next();
						}
					});
				}, {
					get_URL_options : get_URL_options,
					file_name : base_directory + 'menu - ' + category_name
							+ '.' + index + '.htm'
				});
	}

	CeL.run_serial(for_menu_NO, last_count,
	// start from NO. 1
	1, callback);
}

function for_menu_list(html, callback) {
	html = html.between('<div class="table-responsive">', '<footer ');
	// console.log(html);

	var matched,
	// [ all, id ]
	PATTERN_id = /<a href="\/(view\/\d+)"/g, id_list = [];

	while (matched = PATTERN_id.exec(html)) {
		id_list.push(matched[1]);
	}
	// console.log(id_list);
	// console.log(id_list.length);

	CeL.run_serial(get_file_list, id_list, callback, {
		new_files : 0
	});
}

// @see label_CJK_patterns @ CeL.application.net.wiki
// 年月号: e.g., 2017年01月号
// 第巻: 第01巻
var PATTERN_has_jp = /[\u3041-\u30FF\u31F0-\u31FF\uFA30-\uFA6A第巻]/;

/** node.js file system module */
var node_fs = require('fs');

function get_file_list(callback, id) {
	// CeL.set_debug(6);
	this.callback = callback;
	this.id = id;
	// console.log(this);
	// console.log('get_file_list: ' + id);
	CeL.get_URL_cache(base_URL + id,
	//
	parse_file_list.bind(this), {
		get_URL_options : get_URL_options,
		file_name : base_directory + id.replace(/\//g, '-') + '.html'
	});
}

function for_file_page(html) {
	var name = CeL.HTML_to_Unicode(html.between('<td class="viewtorrentname">',
			'</td>')),
	//
	matched = html.match(/showfiles=[^"]+/);
	if (!matched) {
		CeL.error(name + '\n' + html);
	}
	CeL.get_URL_cache(base_URL + '?page=view&tid=' + id + '&' + matched[0],
			parse_file_list, {
				get_URL_options : get_URL_options,
				file_name : base_directory + id.replace(/\//g, '-')
						+ '.list.htm'
			});
}

function get_label(html) {
	return CeL.HTML_to_Unicode(html.replace(/<[^<>]+>/g, '')).trim();
}

// 取得 .torrent 的檔案列表。
function parse_file_list(html, is_cache) {
	var name = get_label(html.between('<h3 class="panel-title">', '</h3>'));
	if (!name && html.includes('DDOS Protection')) {
		CeL.fs_remove(base_directory + this.id + '.html');
		throw 'DDOS Protection';
	}
	html = html.between(' id="collapseFileList"', '</table>');
	if (!is_cache) {
		this.new_files++;
	}
	// 就算利用的是 cache，依然檢查檔案而不直接跳出。

	var folder_list = [];
	html.each_between(
	//
	'<i class="glyphicon glyphicon-folder-open"></i>&nbsp;&nbsp;<b>', '</b>',
	//
	function(token) {
		if (token = get_label(token)) {
			folder_list.push(token);
		}
	});

	// CeL.log(name);
	// CeL.log(name + ': ' + html);
	// console.log(html);
	var file_list = [];
	html.each_between('<i class="glyphicon glyphicon-file"></i>&nbsp;',
	//
	'</td>', function(token) {
		if (token = get_label(token)) {
			file_list.push(token);
		}
	});
	// console.log(file_list);
	if (false) {
		CeL.fs_write(base_directory + id + '.data.json', {
			name : name,
			files : file_list
		});
	}

	function rename_process(fso_name) {
		var matched;
		// CeL.debug('[' + fso_name + '] ' + name, 0, 'rename_process');
		if (PATTERN_full_latin_or_sign.test(name) || !fso_name
		//
		|| !(matched = fso_name.match(PATTERN_latin_fso_name))) {
			return;
		}

		// CeL.log(matched[1] + ': ' + name);

		function rename(fso_name, is_file) {
			var fso_key = is_file ? target_files[fso_name]
					: target_directories[fso_name];
			if (!fso_key || fso_name.includes(name)) {
				return;
			}
			CeL.info(fso_name + '→' + name);
			var error = CeL.fs_move(target_directory + fso_name,
			//
			target_directory + CeL.to_file_name(name).replace(/\.+$/, '') + '.'
					+ fso_name);
			if (error) {
				CeL.error(error);
			} else if (is_file) {
				delete target_files[fso_name];
			} else {
				delete target_directories[fso_name];
			}
		}

		rename(matched[0], true);
		rename(matched[0].replace(/ /g, '_'), true);
		rename(matched[0].replace(/_/g, ' '), true);

		rename(matched[1]);
		rename(matched[1].replace(/ /g, '_'));
		rename(matched[1].replace(/_/g, ' '));
	}

	if (folder_list.length === 1
			&& PATTERN_full_latin_or_sign.test(folder_list[0])) {
		rename_process(folder_list[0]);
	} else if (file_list.length === 1) {
		rename_process(file_list[0]);
	} else if (0) {
		CeL.warn(name + ': ' + JSON.stringify(folder_list));
		CeL.warn('file_list: [' + file_list.length + ']'
				+ JSON.stringify(file_list.slice(0, 20)));
	}

	typeof this.callback === 'function' && this.callback();
}
