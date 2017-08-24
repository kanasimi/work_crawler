/**
 * 依照名稱分類檔案與目錄。符合條件時壓縮目錄。
 * 
 * @since 2017/8/24 10:16:34
 */

'use strict';

global.need_work_id = false;

require('../work_crawler_loder.js');

var log_file = CeL.env.script_name + '.log.txt';

// ----------------------------------------------------------------------------
// Load module.

CeL.run(
// for
'application.OS.Windows.archive');

// ----------------------------------------------------------------------------

var
// 下載完成、要處理的檔案/目錄所放置的目錄。
target_directory = process.argv[2] || global.completed_directory || '.',
// 檔案分類完後要放置的標的目錄。
catalog_directory = process.argv[3] || global.catalog_directory;

var fso_name_list = CeL.read_directory(target_directory);

if (!fso_name_list) {
	CeL.error(CeL.env.script_name + ': The target directory ['
			+ target_directory + '] does not exist?');
	process.exit(1);
}

// -----------------------------------------------------------------

CeL.info(CeL.env.script_name + ': ' + target_directory + ': '
		+ fso_name_list.length + ' files / directories to check.');

// console.log(fso_name_list.slice(0, 3));

// profile configuration
compress_each_directory.profiles = {
	image : {
		file_type : 'zip',
		switches : '-mx=0 -r -sdel -sccUTF-8'
	},
	game : {
		file_type : '7z',
		switches : '-mx=9 -r -sdel -sccUTF-8'
	},
	padding : {
		file_type : '7z',
		switches : '-mx=9 -r -sdel -sccUTF-8'
	}
};

function append_path_separator(directory_name) {
	return /[\\\/]$/.test(directory_name) ? directory_name : directory_name
			+ CeL.env.path_separator;
}

var node_fs = require('fs');
function add_log(message) {
	node_fs.appendFileSync(log_file, new Date().toISOString() + '	' + message
			+ CeL.env.line_separator);
}

target_directory = append_path_separator(target_directory);

if (!catalog_directory) {
	// Get the parent directory of target_directory
	catalog_directory = target_directory.replace(/[^\\\/]+[\\\/]*$/, '');
}

catalog_directory = {
	anime : [ 'a' ],
	anime_sub : {
		anime_music : '_music',
		anime_OK : '_OK'
	},
	// 一般コミック
	comic : [ 'c' ],
	comic_sub : {
		shojo_manga : '_少女コミック',
		artbook : '_イラスト,画集,Visual Book,Art Work,Artbook',
		comic_magazine : '_雑誌'
	},
	adult : [ 'H', 'Hcomic' ],
	adult_sub : {
		adult_animation : '_Hanime,18禁アニメ',
		adult : '_noACG_H,個人撮影,写真集,グラビア,援交',
		adult_comic : '成年コミック',
	},
	singer : [ 's' ],
	// 一般小説
	novel : [ 'n' ],
	novel_sub : {
		erotic_novel : '_官能'
	},
	game : [ '_game,ゲーム,同人', 'g' ],
	game_sub : {
		doujin : '_DOUJIN,同人',
		cosplay : '_cosplay,コスプレ',
		game_music : '_music',
		general_game : '_一般ゲーム'
	},
	tool : [ 'Tools', 'tool', 't' ],
	root : append_path_separator(catalog_directory)
};

Object.keys(catalog_directory).forEach(function(catalog) {
	var directory = catalog_directory[catalog];
	if (Array.isArray(directory)) {
		if (!directory.some(function(candidate) {
			candidate = catalog_directory.root + candidate;
			if (CeL.directory_exists(candidate)) {
				catalog_directory[catalog] = append_path_separator(candidate);
				return true;
			}
		})) {
			CeL.info('Skip: ' + catalog);
			delete catalog_directory[catalog];
		}
		return;
	}

	var matched = catalog.match(/^(.+)_sub$/);
	if (matched && CeL.is_Object(directory)) {
		delete catalog_directory[catalog];
		var main_catalog_directory = catalog_directory[matched[1]];
		if (!main_catalog_directory) {
			return;
		}
		Object.keys(directory).forEach(function(sub_catalog) {
			var sub_catalog_directory = append_path_separator(
			//
			main_catalog_directory + directory[sub_catalog]);
			if (!CeL.directory_exists(sub_catalog_directory)) {
				var message = 'Create directory of sub-catalog ['
				//
				+ sub_catalog + ']:	' + sub_catalog_directory;
				add_log(message);
				CeL.info(message);
				CeL.create_directory(sub_catalog_directory);
			}
			catalog_directory[sub_catalog] = sub_catalog_directory;
		});
		return;
	}
});

// console.log(catalog_directory);

// -----------------------------------------------------------------

// 首先整個掃描一次，篩選出需要處理的目錄，放在process_queue。
var process_queue = [], PATTERN_executable_file = /\.(?:exe)$/i;
fso_name_list.forEach(check_fso);

function check_fso(fso_name) {
	function test_size_OK(size, profile, message) {
		if (!size || biggest_file_size < size) {
			process_queue.push([ directory_path, profile, message ]);
			return true;
		}

		CeL.warn('因為最大的檔案有 ' + biggest_file_size + ' B，因此跳過這個' + message
				+ '的目錄: ' + directory_path);
	}

	var directory_path = target_directory + fso_name, fso_status = CeL
			.fs_status(directory_path);
	if (!fso_status) {
		CeL.error('Can not read file / directory: ' + directory_path);
		return;
	}
	if (!fso_status.isDirectory()) {
		classify(fso_name, directory_path, fso_status);
		return;
	}

	directory_path += CeL.env.path_separator;
	var sub_fso = CeL.read_directory(directory_path);
	if (!sub_fso) {
		CeL.error('Can not read directory: ' + directory_path);
		return;
	}
	if (sub_fso.length === 0) {
		if (!Object.values(catalog_directory).includes(directory_path))
			CeL.warn('Empty directory: ' + directory_path);
		return;
	}

	var image_count = 0, exe_count = 0, _____padding_file_count = 0, size_array = [],
	//
	sub_files = [], sub_directories = [];
	sub_fso.forEach(function(sub_fso_name) {
		if (sub_fso_name.startsWith('_____padding_file_')) {
			_____padding_file_count++;
			return;
		}

		// TODO: .bmp
		if (/\.(?:jpg|jpeg|png|gif)$/i.test(sub_fso_name)) {
			image_count++;
		} else if (PATTERN_executable_file.test(sub_fso_name)) {
			exe_count++;
		}

		var sub_fso_status = CeL.fs_status(directory_path + sub_fso_name);
		if (!sub_fso_status) {
			return;
		}
		if (sub_fso_status.size > 0) {
			size_array.push(sub_fso_status.size);
		}
		if (sub_fso_status.isDirectory()) {
			sub_directories.push(sub_fso_name);
		} else {
			sub_files.push(sub_fso_name);
		}
	});

	if (_____padding_file_count > 0 && test_size_OK(null, {
		profile : 'padding',
		archive : directory_path + '_____padding_file.7z',
		fso_list : directory_path + '_____padding_file_*'
	}, '含有 padding file')) {
		return;
	}

	// 降序序列排序: 大→小
	size_array.sort(CeL.descending);
	// 最大的檔案size
	var biggest_file_size = size_array[0];

	if (exe_count > 0
			&& test_size_OK(1e9, 'game', '含有 ' + exe_count + ' 個可執行檔')) {
		return;
	}

	if ((image_count > 20 ? image_count / sub_fso.length > .8
	//
	: image_count > 2 && image_count > sub_fso.length - 2)
			// 壓縮大多只有圖片的目錄。
			&& test_size_OK(1e7, 'image', '含有 ' + image_count + '/'
					+ sub_fso.length + ' 個圖片')) {
		return;
	}

	if (size_array.length < 9 && !(biggest_file_size > 2e8)
			&& sub_directories.length < 9) {
		if (sub_directories.some(function(sub_directory) {
			sub_directory = directory_path + sub_directory;
			var sub_fso_name_list = CeL.read_directory(sub_directory);
			return sub_fso_name_list.some(function(name) {
				return PATTERN_executable_file.test(name);
			});
		}) && test_size_OK(null, 'game', '次目錄中含有可執行檔')) {
			return;
		}
	}

	if (image_count > 9 && image_count / sub_fso.length > .5) {
		CeL.warn('需要手動檢查的目錄: ' + directory_path);
		return;
	}

	classify(fso_name, directory_path, fso_status);
}

// -----------------------------------------------------------------
// classification 依照檔案名稱來做基本的分類。

function classify(fso_name, fso_path, fso_status) {
	function move_to(catalog) {
		var move_to_path = catalog_directory[catalog];
		if (!move_to_path) {
			return;
		}
		move_to_path += fso_name;
		while (CeL.fs_status(move_to_path)) {
			move_to_path = move_to_path.replace(
			// Get next index that can use.
			/( )?(?:\((\d{1,3})\))?(\.[^.]*)?$/, function(all, prefix_space,
					index, extension) {
				if (index > 99) {
					throw 'The index ' + index + ' is too big! '
					//
					+ move_to_path;
				}
				return (prefix_space || !index ? ' ' : '') + '('
						+ ((index | 0) + 1) + ')' + (extension || '');
			});
		}
		CeL.info(CeL.display_align([ [ 'Move ' + catalog + ': ', fso_path ],
				[ '→ ', move_to_path ] ]));
		add_log('Move ' + catalog + ':	' + fso_path + '	→	' + move_to_path);
		CeL.move_fso(fso_path, move_to_path);
	}

	var matched;

	if (/[(（]一般コミック/.test(fso_name)) {
		move_to('comic');
		return;
	}

	if (/[(（]一般小説/.test(fso_name)) {
		move_to('novel');
		return;
	}

	if (/[(（]一般ゲーム/.test(fso_name)) {
		move_to('general_game');
		return;
	}

	if (/\((?:(?:一般)?画集)/.test(fso_name)) {
		move_to('artbook');
		return;
	}

	if (/^\((?:C\d{1,2})\)/.test(fso_name)
	// "(サンクリ2015 Winter) "
	|| /^\((?:同人|COMIC1☆|こみトレ|例大祭|紅楼夢|ふたけっと|サンクリ)/.test(fso_name)) {
		move_to('doujin');
		return;
	}

	if (/^週刊/.test(fso_name)) {
		move_to('comic_magazine');
		return;
	}

	// TODO: add more patterns
}

// -----------------------------------------------------------------

CeL.info(CeL.env.script_name + ': ' + process_queue.length
		+ ' directories to compress.');

var
// TODO: use application.OS.Windows.archive,
// application.OS.execute instead
/** node.js: run OS command */
execSync = require('child_process').execSync;

process_queue.forEach(compress_each_directory);

function escape_filename(filename) {
	return /^["']/.test(filename) ? filename : '"' + filename + '"';
}

function compress_each_directory(config, index) {
	// config: [ directory_path, profile_name, message ]
	var directory_path = config[0], profile_name = config[1], message = config[2],
	// profile configuration
	profile = Object.assign(CeL.null_Object(),
	//
	compress_each_directory.profiles[profile_name.profile || profile_name]);
	Object.assign(profile, {
		// target archive file
		archive : directory_path.replace(/[\\\/]$/, '') + '.'
				+ profile.file_type,
		fso_list : directory_path
	});
	if (CeL.is_Object(profile_name)) {
		Object.assign(profile, profile_name);
		profile_name = profile_name.profile;
	}

	CeL.info((index + 1) + '/' + process_queue.length + ' Compress '
			+ profile_name + ': [' + directory_path + '] ' + (message || '')
			+ '...');

	if (CeL.fs_status(profile.archive)) {
		CeL.error('Target exists: ' + profile.archive);
		return;
	}

	add_log('Compress ' + profile_name + ':	' + profile.archive);

	var command = '"C:\\Program Files\\7-Zip\\7z.exe" a -t'
			+ profile.file_type
			+ (profile.switches ? ' ' + profile.switches : '')
			+ ' -- '
			+ escape_filename(profile.archive)
			+ ' '
			+ (Array.isArray(profile.fso_list) ? profile.fso_list
					.map(escape_filename) : escape_filename(profile.fso_list));
	// CeL.info('Run: ' + command);
	execSync(command);
}

// -----------------------------------------------------------------
// finish up

// CeL.log('Done.');
