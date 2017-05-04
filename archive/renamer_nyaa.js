/**
 * rename files download from nyaa.
 * 
 * e.g., abc.rar → 確実な名前.abc.rar
 * 
 * node renamer.js [category [directory]]
 * 
 * @since 2016/12/19 14:17:11 初版
 */

'use strict';

global.need_work_id = false;

require('./work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.get_URL.default_user_agent = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36";

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
	Hcomic : [ 'cache_sukebei', 'https://sukebei.nyaa.se/', '7_26', 100 ],
	comic : [ 'cache_nyaa', 'https://www.nyaa.se/', '2_13', 100 ]
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
//
PATTERN_latin_file_name = /^([\u0020-\u007F]+)\.[a-z]+$/,
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

get_menu_list();

function get_menu_list(callback) {
	CeL.run_serial(function(run_next, index) {
		CeL.info('get_menu_list: menu ' + category_name + ' ' + index + '/'
				+ last_count);
		CeL.get_URL_cache(base_URL + '?cats=' + category_NO + '&offset='
				+ index, function(html) {
			for_menu_list(html, function() {
				CeL.fs_write(cache_file, cache_data);
				if (this.new_files === 0) {
					CeL.info('No more new menu files.');
				} else {
					CeL.info(this.new_files + ' new files.');
				}
				if (this.new_files > 0 || reget > 1) {
					run_next();
				}
			});
		}, {
			reget : reget,
			file_name : base_directory + 'menu - ' + category_name + '.'
					+ index + '.htm'
		});
	}, last_count, 1, callback);
}

function for_menu_list(html, callback) {
	html = html.between('<table class="tlist">', '</table>');
	// console.log(html);

	var matched, PATTERN_id = /tid=(\d+)">/g, id_list = [];

	while (matched = PATTERN_id.exec(html)) {
		id_list.push(+matched[1]);
	}
	// console.log(id_list);

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
	var _this = this;
	// CeL.set_debug(6);
	CeL.get_URL_cache(base_URL + '?page=view&tid=' + id, function(html) {
		var name = CeL.HTML_to_Unicode(html.between(
				'<td class="viewtorrentname">', '</td>')),
		//
		matched = html.match(/showfiles=[^"]+/);
		if (!matched) {
			CeL.error(name + '\n' + html);
		}
		CeL.get_URL_cache(base_URL + '?page=view&tid=' + id + '&' + matched[0],
		// 取得 .torrent 的檔案列表。
		function(html, is_cache) {
			var file_list = [], matched, PATTERN_file
			//
			= /<td class="fileentryname">([^<>]+)<\/td>/g;
			html = html.between('<table class="viewfiletable">', '</table>');
			if (!is_cache) {
				_this.new_files++;
			}
			// 就算利用的是 cache，依然檢查檔案而不直接跳出。

			// CeL.log(name + ': ' + html);
			while (matched = PATTERN_file.exec(html)) {
				file_list.push(CeL.HTML_to_Unicode(matched[1]));
			}
			if (false) {
				CeL.fs_write(base_directory + id + '.data.json', {
					name : name,
					files : file_list
				});
			}

			if (file_list.length !== 1) {
				// CeL.warn(name + ': ' + JSON.stringify(file_list));
			} else if (!PATTERN_full_latin_or_sign.test(name)
			//
			&& (matched = file_list[0].match(PATTERN_latin_file_name))) {
				// CeL.log(matched[1] + ': ' + name);

				function rename(fso_name, is_file) {
					var fso_key = is_file ? target_files[fso_name]
							: target_directories[fso_name];
					if (!fso_key || fso_name.includes(name)) {
						return;
					}
					CeL.info(fso_name + '→' + name);
					var error = CeL.fs_move(target_directory + fso_name,
							target_directory + CeL.to_file_name(name) + '.'
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

			typeof callback === 'function' && callback();
		}, base_directory + id + '.list.htm');
	}, base_directory + id + '.htm');
}
