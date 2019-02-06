/**
 * @fileoverview 依照名稱、內容分類檔案與目錄。符合條件時壓縮目錄。
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
);

// ----------------------------------------------------------------------------

var do_compress = true,
// 下載完成、要處理的檔案/目錄所放置的目錄。
target_directory = process.argv[2]
		|| CeL.first_exist_fso(global.completed_directory) || '.',
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
	'image folder' : {
		file_type : 'zip',
		switches : '-mx=0 -r -sdel -sccUTF-8'
	},
	'game folder' : {
		file_type : '7z',
		switches : '-mx=9 -r -sdel -sccUTF-8'
	},
	'game file' : {
		file_type : '7z',
		switches : '-mx=9 -r -sdel -sccUTF-8'
	},
	'padding files' : {
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

// sub-catalog, 子分類目錄。
function is_sub_catalog(catalog) {
	var matched = catalog.match(/^(.+)_sub$/);
	return matched && matched[1];
}

// 候選/擬分類目錄。
function is_pseudo_catalog(catalog) {
	return catalog.startsWith('_');
}

catalog_directory = {
	anime : [ 'anime,アニメ', 'a' ],
	anime_sub : {
		anime_misc : '_misc',
		anime_music : '_music',
		// _OK,_completed,_finished
		anime_OK : '_OK'
	},
	// 一般コミック
	comic : [ 'comic,一般コミック,画集', 'c' ],
	comic_sub : {
		// 少女漫画, Teens' Love 輕熟女漫畫
		shojo_manga : '_Sho-comi,少女コミック,一般コミック・少女,百合姫',
		artbook : '_イラスト,画集,Visual Book,Art Work,Artbook',
		CG_no_title : '_イラスト,画集,Visual Book,Art Work,Artbook/_no title',
		comic_magazine : '_雑誌'
	},
	adult : [ 'Hcomic,成年コミック,無修正', 'Hcomic', 'H' ],
	adult_sub : {
		adult_animation : '_Hanime,18禁アニメ',
		adult : '_noACG_H,写真集,グラビア',
		adult_comic : '成年コミック',
	},
	singer : [ '_singer,アルバム,ボイス', 's' ],
	// 一般小説
	novel : [ '_book,novel,小説', 'n' ],
	novel_sub : {
		// _book that not novel or ライトノベル or ファンタジ,一般書籍,ノンフィクション
		general_book : '_一般書籍',
		// _官能,官能小説,エロライトノベル,フランス書院,美少女文庫,ティアラ文庫
		erotic_novel : '_官能'
	},
	game : [ '_game,ゲーム,同人', 'g' ],
	game_sub : {
		doujin : '!DOUJIN,同人',
		doujinshi : '!同人誌',
		cosplay : '!cosplay,コスプレ',
		game_CG : '!CG,画集',
		game_music : '!music',
		general_game : '!一般ゲーム'
	},
	tool : [ 'Tools', 't' ],

	_maybe_doujinshi : null,
	_maybe_comic_novel : null,
	_maybe_translated_adult_comic : null,
	_maybe_anime : null,
	_maybe_music : null,
	_maybe_image : null,
	_maybe_game : null,
	_should_be_game : null,

	root : append_path_separator(catalog_directory)
};

var auto_created_directory_list = [];

// 初始化各個分類目錄的位置。
Object.keys(catalog_directory).forEach(function(catalog) {
	var directory = catalog_directory[catalog];
	if (is_pseudo_catalog(catalog) && !directory) {
		// 擬分類目錄。
		directory = catalog_directory[catalog] = [ catalog ];
	}
	if (Array.isArray(directory)) {
		if (!directory.some(function(candidate) {
			if (is_pseudo_catalog(catalog)) {
				candidate = target_directory + candidate;
				auto_created_directory_list.push(candidate);
				CeL.create_directory(candidate);
			} else {
				candidate = catalog_directory.root + candidate;
			}
			// console.log([ catalog, candidate, target_directory ]);
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

	// assert: directory = {catalog:'string'}
	var matched = is_sub_catalog(catalog);
	if (matched && CeL.is_Object(directory)) {
		delete catalog_directory[catalog];
		var main_catalog_directory = catalog_directory[matched];
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
				CeL.debug(message);
				auto_created_directory_list.push(sub_catalog_directory);
				CeL.create_directory(sub_catalog_directory);
			}
			catalog_directory[sub_catalog] = sub_catalog_directory;
		});
		return;
	} else if (catalog !== 'root') {
		CeL.error('Invalid catalog: ' + catalog);
	}
});

// console.log(catalog_directory);

// -----------------------------------------------------------------

// 首先整個掃描一次，篩選出需要處理的目錄，放在process_queue。
var process_queue = [],
// 可執行檔或函式庫
PATTERN_executable_file = /\.(?:exe|dll|pkg)$/i;
fso_name_list.forEach(check_fso);

function check_fso(fso_name) {
	if (fso_name in catalog_directory) {
		// 不處理分類的標的目錄。
		return;
	}

	function test_size_OK(size, profile, message) {
		if (!size || biggest_file_size < size) {
			process_queue.push([ directory_path, profile, message ]);
			return true;
		}

		CeL.warn('因為最大的檔案有 ' + biggest_file_size + ' B，因此跳過這個' + message
				+ '的目錄: ' + directory_path);
	}

	var directory_path = target_directory + fso_name,
	//
	fso_status = CeL.fso_status(directory_path);
	if (!fso_status) {
		CeL.error('Can not read file / directory: ' + directory_path);
		return;
	}
	if (!fso_status.isDirectory()) {
		// i.e. file

		// 經過測試，.pkg file 通常越壓縮越大。
		if (false && PATTERN_executable_file.test(fso_name)) {
			process_queue.push([ directory_path, 'game file', '為遊戲可執行檔或函式庫' ]);
		} else
			classify(fso_name, directory_path, fso_status);
		return;
	}

	// assert: fso_status.isDirectory()
	directory_path += CeL.env.path_separator;
	var sub_fso_list = CeL.read_directory(directory_path);
	if (!sub_fso_list) {
		CeL.error('Can not read directory: ' + directory_path);
		return;
	}
	if (sub_fso_list.length === 0) {
		if (!Object.values(catalog_directory).includes(directory_path))
			CeL.warn('Empty directory: ' + directory_path);
		return;
	}
	// TODO: 這會漏掉只有空目錄的情況。

	var image_count = 0, exe_count = 0, iso_count = 0, music_count = 0, anime_count = 0, archive_count = 0, _____padding_file_count = 0, non_zero_size_count = 0,
	//
	sub_files = [], sub_directories = [], sub_sub_files_count = 0,
	// 最大的檔案size
	biggest_file_size = 0;

	function check_sub_file(sub_fso_name, sub_fso_status) {
		sub_sub_files_count++;
		if (sub_fso_status.size > 0) {
			if (biggest_file_size < sub_fso_status.size)
				biggest_file_size = sub_fso_status.size;
			non_zero_size_count++;
		}
		// TODO: .bmp
		if (/\.(?:jpg|jpeg|webp|png|gif|ico|icon)$/i.test(sub_fso_name)) {
			image_count++;
		} else if (PATTERN_executable_file.test(sub_fso_name)) {
			exe_count++;
		} else if (/\.(?:cue|iso|mdf|mds|bin|ccd|sub)$/i.test(sub_fso_name)) {
			iso_count++;
		} else if (/\.(?:cue|mp3|flac|ape|wav)$/i.test(sub_fso_name)) {
			music_count++;
		} else if (/\.(?:avi|mp4|mkv|ass)$/i.test(sub_fso_name)) {
			anime_count++;
		} else if (/\.(?:zip|rar|7z|lzh)$/i.test(sub_fso_name)) {
			archive_count++;
		}
	}

	// for 深入第2子層以下
	// search path: directory/sub_fso_name
	function search_sub_sub_folder_for_files(sub_fso_name, directory) {
		var sub_fso_status = CeL.fso_status(directory + sub_fso_name);
		if (!sub_fso_status) {
			return;
		}

		if (sub_fso_status.isDirectory()) {
			var sub_sub_fso_list = CeL.read_directory(directory + sub_fso_name);
			sub_sub_fso_list.forEach(function(sub_sub_fso_name) {
				search_sub_sub_folder_for_files(sub_sub_fso_name, directory
						+ sub_fso_name + CeL.env.path_separator);
			});
		} else {
			check_sub_file(sub_fso_name, sub_fso_status);
		}
	}

	// for 第一子層
	sub_fso_list.forEach(function(sub_fso_name) {
		if (sub_fso_name.startsWith('_____padding_file_')) {
			_____padding_file_count++;
			return;
		}

		var sub_fso_status = CeL.fs_status(directory_path + sub_fso_name);
		if (!sub_fso_status) {
			return;
		}

		if (sub_fso_status.isDirectory()) {
			sub_directories.push(sub_fso_name);
			search_sub_sub_folder_for_files(sub_fso_name, directory_path);
		} else {
			sub_files.push(sub_fso_name);
			check_sub_file(sub_fso_name, sub_fso_status);
		}
	});

	fso_status.counter = {
		sub_sub_files : sub_sub_files_count,
		_____padding_file : _____padding_file_count,
		exe : exe_count,
		iso : iso_count,
		music : music_count,
		anime : anime_count,
		zero_size : non_zero_size_count,
		image : image_count,
		archive : archive_count
	};
	// console.log(directory_path);
	// console.log(fso_status.counter);

	if (_____padding_file_count > 0 && test_size_OK(null, {
		profile : 'padding files',
		archive : directory_path + '_____padding_file.7z',
		fso_list : directory_path + '_____padding_file_*'
	}, '含有 padding file')) {
		return;
	}

	// 降序序列排序: 大→小
	// non_zero_size_array.sort(CeL.descending);

	if ((exe_count > 0 || iso_count > 1 && sub_sub_files_count < 20 || iso_count === sub_sub_files_count)
			&& test_size_OK(1e10, 'game folder', '含有 ' + exe_count + '/'
					+ sub_sub_files_count + ' 個可執行檔或函式庫')) {
		return;
	}

	if ((image_count > 20 ? image_count / sub_sub_files_count > .8
	//
	: image_count > 2 && image_count > sub_sub_files_count - 2)) {
		fso_status.maybe_image = true;
		// 壓縮大多只有圖片的目錄。
		if (test_size_OK(5e7, 'image folder', '含有 ' + image_count + '/'
				+ sub_sub_files_count + ' 個圖片')) {
			return;
		}
	}

	if (non_zero_size_count < 9 && !(biggest_file_size > 2e8)
	//
	&& sub_directories.length < 9
	//
	&& sub_directories.some(function(sub_directory) {
		sub_directory = directory_path + sub_directory;
		var sub_fso_name_list = CeL.read_directory(sub_directory);
		return sub_fso_name_list.some(function(name) {
			return PATTERN_executable_file.test(name);
		});
	}) && test_size_OK(null, 'game folder', '次目錄中含有可執行檔或函式庫')) {
		return;
	}

	if (image_count > 9 && image_count / sub_sub_files_count > .5) {
		fso_status.maybe_image = true;
		CeL.warn('需要手動檢查的目錄: ' + directory_path);
		// return;
	}

	classify(fso_name, directory_path, fso_status, sub_fso_list);
}

// -----------------------------------------------------------------
// classification 依照檔案名稱來做基本的分類。

function classify(fso_name, fso_path, fso_status, sub_fso_list) {
	function move_to(catalog) {
		var move_to_path = catalog_directory[catalog];
		if (!move_to_path) {
			return;
		}
		if (fso_path.replace(/[\\\/]+$/, '') === move_to_path
				+ fso_name.replace(/[\\\/]+$/, '')
		// || /\((\d{1,3})\)(\.[^.]*)?$/.test(fso_name)
		) {
			// Skip the same source and target. No need to move.
			return;
		}
		move_to_path = CeL.next_fso_NO_unused(move_to_path + fso_name, true);
		CeL.info(CeL.display_align([ [ 'Move ' + catalog + ': ', fso_path ],
				[ '→ ', move_to_path ] ]));
		add_log('Move ' + catalog + ':	' + fso_path + '	→	' + move_to_path);
		CeL.move_fso(fso_path, move_to_path);
	}

	var matched;

	if (/[\[(（【]一般(?:コミック|漫画|書籍)/.test(fso_name)
			|| /(?:^|[^a-z])Manga[^a-z]/i.test(fso_name)) {
		move_to('comic');
		return;
	}

	if (/[\[(（【]少女(?:コミック|漫画|書籍)/.test(fso_name)) {
		move_to('shojo_manga');
		return;
	}

	if (/[\[(（【](?:成年(?:コミック|漫画|書籍)|Anthology|アンソロジー)/.test(fso_name)
			|| /FAKKU|ガチコミ/.test(fso_name)) {
		move_to('adult_comic');
		return;
	}

	if (/[\[(（【]官能小説/.test(fso_name)
			|| /エロライトノベル|フランス書院|美少女文庫|ティアラ文庫/.test(fso_name)) {
		move_to('erotic_novel');
		return;
	}

	if (/[\[(（【]一般小説/.test(fso_name)
			|| /(?:^|[^a-z])Novel[^a-z]/i.test(fso_name)) {
		move_to('novel');
		return;
	}

	if (/[\[(（【]一般ゲーム/.test(fso_name)) {
		move_to('general_game');
		return;
	}

	if (/[\[(（【](?:18禁ゲーム|ACT|ADV|RPG|SLG|3D|PL\])/i.test(fso_name)
			|| /パッケージ版|修正パッチ|予約特典|本編同梱|\+ ?update/i.test(fso_name)) {
		move_to('game');
		return;
	}

	if (/[\[(（【](?:ゲームCG|Game CG)/i.test(fso_name)) {
		move_to('game_CG');
		return;
	}

	if (/[\[(（【](?:(?:一般)?画集)/.test(fso_name)) {
		move_to('artbook');
		return;
	}

	if (/[\[(（【]一般書籍/.test(fso_name)) {
		move_to('general_book');
		return;
	}

	if (/^\((?:C\d{2,3}|CC福岡\d{2,3}|CC大阪\d{2,3}|Futaket ?\d{2}|コミティア\d{3}|Cレヴォ\d{2})|COMIC1(?:[☆_]\d{2})?\)/
			.test(fso_name)
			|| fso_name.includes('同人誌')
			// "(サンクリ2015 Winter) "
			|| /^\((?:同人|COMIC1☆|こみトレ|例大祭|紅楼夢|ふたけっと|サンクリ)/.test(fso_name)) {
		move_to('doujinshi');
		return;
	}

	if (/^(?:[\[(]?Pixiv|artist -|art -|アーティスト -)/i.test(fso_name)) {
		move_to('CG_no_title');
		return;
	}

	// ------------------------------------------

	if (fso_name.startsWith('[Shin-S]')) {
		move_to('anime_music');
		return;
	}

	// ------------------------------------------

	if (/\.(zip|rar|7z)$/.test(fso_name)
			&& /第\d{1,2}(?:-\d{1,2})?巻/.test(fso_name)) {
		move_to('_maybe_comic_novel');
		return;
	}

	matched = fso_name
			.match(/\(([^()\[\]]+)\)(?: *[\[【](?:DL版|Digital|見本|ページ欠落)[\]】])*(?: *\(\d\))?\.(zip|rar|7z|cbz)$/);
	if (matched) {
		if (/^x\d{3,4}$/.test(matched[1])
		// COMIC 阿吽, コミックマグナム
		|| /^(?:COMIC |コミック)/i.test(matched[1])) {
			move_to('adult_comic');
			return;
		}

		if (/^ビッグコミックス/.test(matched[1])) {
			move_to('comic');
			return;
		}

		if (
		// "1", "12-13-15", "3211231", "2014"
		/^(?:[\d\- ]*|Ongoing|Eng?|English(?:-Uncen)?|korean|kor|Jap|Japanese|RUS|英訳|中国語|更正|GIFs?|CG|mp3|FLAC|APE|文庫版?)$/i
				.test(matched[1])) {
			// [Pixiv] 60枚 (3322006).zip
		} else if (matched[1] !== '仮') {
			move_to('_maybe_doujinshi');
			return;
		}
	}

	// NG: RUS: "Crusaders"
	if (/中文|漢化|翻中|汉化|\[(?:中|CHT|ENG)\]|\(Eng\)|English|Español|Korean|Chinese|Spanish|Russian|翻訳|英訳|中国語/i
			.test(fso_name)) {
		move_to('_maybe_translated_adult_comic');
		return;
	}

	// 必須放在 _maybe_translated_adult_comic 之後。
	// NG: |[^\d]20[12]\d[.\-][01]\d[^\d]
	// e.g., "[2018.01.17] Pastel＊Palettes - ゆら・ゆらRing-Dong-Dance"
	// Devils were tempted by ballad of anima... Ver.2018-01-11
	if (/^週刊|\[雑誌|[^\d]20[12]\d[年\-][01]\d月|20[12]\d年\d{1,2}号/.test(fso_name)) {
		move_to('comic_magazine');
		return;
	}

	// TODO: add more patterns

	// ------------------------------------------

	if (!sub_fso_list) {
		return;
	}

	if (sub_fso_list.some(function(sub_fso_name) {
		// 18禁ゲーム
		if (/[\[(（【](?:18禁ゲーム)/i.test(sub_fso_name)) {
			move_to('_should_be_game');
			return true;
		}
	})) {
		return;
	}

	if (fso_status.counter.exe > 0 || fso_status.counter.iso > 0
			|| /[^a-z\d]ver[. ]\d\.\d+/i.test(fso_name)) {
		move_to('_maybe_game');
		return;
	}

	if (fso_status.counter.anime / fso_status.counter.sub_sub_files > .4) {
		move_to('anime_OK');
		return;
	}

	if (fso_status.counter.anime > 9
			|| fso_status.counter.anime / fso_status.counter.sub_sub_files > .1) {
		move_to('_maybe_anime');
		return;
	}

	if (fso_status.maybe_image) {
		move_to('_maybe_image');
		return;
	}

	if (fso_status.counter.music > 0) {
		move_to('_maybe_music');
		return;
	}

	// TODO: add more patterns
}

// -----------------------------------------------------------------
// 先去掉空的分類目錄再慢慢壓縮。

auto_created_directory_list.forEach(function(auto_created_directory) {
	// 移除空的擬分類目錄/子分類目錄。
	if (CeL.directory_is_empty(auto_created_directory)) {
		CeL.remove_directory(auto_created_directory);
	}
});

// console.log(catalog_directory);
Object.keys(catalog_directory).forEach(function(catalog) {
	var move_to_path = catalog_directory[catalog];
	if (!is_pseudo_catalog(catalog) && !is_sub_catalog(catalog)
	//
	|| !CeL.directory_exists(move_to_path)) {
		return;
	}

	// 移除空的擬分類目錄/子分類目錄。
	if (CeL.directory_is_empty(move_to_path)) {
		CeL.log('Remove empty directory: ' + move_to_path);
		CeL.remove_directory(move_to_path);
	} else if (is_sub_catalog(catalog)) {
		CeL.info('Directory of sub-catalog [' + catalog
		//
		+ '] created: ' + move_to_path);
	}
});

// -----------------------------------------------------------------

CeL.info(CeL.env.script_name + ': ' + process_queue.length
		+ ' directories to compress.');

// cache the path of p7z executable file
var p7zip_path = CeL.executable_file_path('7z')
		|| '%ProgramFiles%\\7-Zip\\7z.exe',
// TODO: use application.OS.Windows.archive,
// application.OS.execute instead
/** node.js: run OS command */
execSync = require('child_process').execSync;

if (process_queue.length > 0) {
	if (do_compress)
		process_queue.forEach(compress_each_directory);
	else
		CeL.info('因為未設定要壓縮 (do_compress)，有 ' + process_queue.length
				+ '個檔案或資料夾沒有壓縮。');
}

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

	process.title = (index + 1) + '/' + process_queue.length + ' compressing';
	CeL.info((index + 1) + '/' + process_queue.length + ' Compress '
			+ profile_name + ': [' + directory_path + '] ' + (message || '')
			+ '...');

	if (CeL.fs_status(profile.archive)) {
		CeL.error('Target exists: ' + profile.archive);
		return;
	}

	add_log('Compress ' + profile_name + ':	' + profile.archive);

	var command = '"'
			+ p7zip_path
			+ '" a -t'
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

process.title = CeL.env.script_name + ': done';
// CeL.log('Done.');
