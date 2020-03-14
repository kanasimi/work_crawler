/**
 * @fileoverview 檢測目標目錄中所有壓縮檔案，並且篩選列出可能是 快压（kuaiZip） 檔案。
 * 
 * @example<code>

node list_kuaiZip.js target_directory

</code>
 * 
 * @since 2018/11/4 13:49:0
 */

'use strict';

global.need_work_id = false;

require('../work_crawler_loader.js');

var log_file = CeL.env.script_name + '.log.txt';

// ----------------------------------------------------------------------------
// Load module.

CeL.run(
// for
);

// ----------------------------------------------------------------------------

// 要處理的目錄。
var target_directory = process.argv[2]/* || '.' */;

if (!target_directory) {
	var main_script = process.mainModule
			&& process.mainModule.filename.match(/[^\\\/]+$/)[0];
	CeL.log('Usage:\n	node ' + main_script + ' "target directory"');
	process.exit();
}

// -----------------------------------------------------------------

// 遍歷檔案系統，對每個 FSO 執行指定的動作。
CeL.storage.traverse_file_system(target_directory, function(file_path) {
	// console.log(file_path);
	var matched = file_path.match(/^(.+[ .])bad\.(zip|rar)$/i);
	if (matched) {
		// recover
		// console.log([file_path, matched[1] + matched[2]]);
		// CeL.move_file(file_path, matched[1] + matched[2]);

		// 跳過已經明確標示為有問題的檔案。
		return;
	}

	var archive_file = new CeL.archive(file_path, {
		program_type : '7z'
	});
	// console.log(archive_file);
	archive_file.info();
	// console.log(archive_file);
	// throw 123123

	// for 7z only!
	if (!archive_file.information) {
		console.log('檔頭有問題的檔案: ' + file_path);
		// 移動/標註此檔案為壞掉的壓縮檔。
		CeL.move_file(file_path, file_path
				.replace(/(\.(?:zip|rar))$/, '.bad$1'))
		// archive_file.verify();
		return;
	}
	if (!archive_file.information.offset
			&& !archive_file.information['tail size']) {
		// archive_file.verify();
		return;
	}
	// 篩選出有問題的檔案

	var read_file = archive_file.fso_status_list[0];
	if (archive_file.fso_status_list.length !== 1
	// "说明.txt". e.g., '佽隴.txt'@Big5
	|| !/^.{2,4}\.txt$/.test(read_file.path)
			|| read_file.size !== read_file['packed size']) {
		// 警告: 有效負載盡頭外還有其他資料
		console.log('有問題的檔案: ' + archive_file.fso_status_list);
		// 移動/標註此檔案為壞掉的壓縮檔。
		CeL.move_file(file_path, file_path
				.replace(/(\.(?:zip|rar))$/, '.bad$1'))
		return;
	}
	// 篩選出可能是 快压（KuaiZip） 檔案

	console.log('可能是 快压（KuaiZip） 檔案: ' + file_path);

}, /\.(zip|rar)$/i);
