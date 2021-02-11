/**
 * @fileoverview 當多次下載一個大檔案，卻各有不同錯誤時，可利用本工具回覆原先完整的檔案。將以多數檔案的內容為準。
 * 
 * @examples<code>

node recover_mulitiple_downloaded_bad_file.js "target file.rar" "bad file.*.rar"
node recover_mulitiple_downloaded_bad_file.js "target file path" "bad file 1" "bad file 2" "bad file 3"

</code>
 * 
 * @since 2020/11/24 18:14:33 初版
 */

'use strict';

global.need_work_id = false;

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------
// Load module.

CeL.run(
	// for HTML_to_Unicode()
	'interact.DOM');

// ----------------------------------------------------------------------------

const node_fs = require('fs');
// 1 MiB
const BUFFER_SIZE = 1 * 1024 * 1024;

let different_byte_count = 0, doubtful_byte_count = 0;

const target_file_path = process.argv[2];
const target_fd = node_fs.openSync(target_file_path, 'w');

const from_fso_list = [];
for (let index = 3; index < process.argv.length; index++) {
	//console.log([process.argv[index], CeL.extract_wildcard(process.argv[index])]);
	from_fso_list.append(CeL.extract_wildcard(process.argv[index]));
}
CeL.info(`合併損壞的檔案成 →	${target_file_path}：\n\t${from_fso_list.join('\n\t')}`);
const from_fd_list = [], from_buffer_list = [];
let max_size = 0;
from_fso_list.forEach(fso_name => {
	const from_fd = node_fs.openSync(fso_name, 'r');
	from_fd_list.push(from_fd);
	from_buffer_list.push(Buffer.alloc(BUFFER_SIZE));
	const fstat = node_fs.fstatSync(from_fd, {
		//bigint: true
	});
	if (max_size < fstat.size)
		max_size = fstat.size;
});
//console.trace(from_buffer_list);

let not_ended = true, process_to = 0;
do {
	let bytesRead_array = [];
	//console.trace(from_buffer_list);
	for (let index = 0; index < from_fd_list.length; index++) {
		const from_fd = from_fd_list[index];
		//console.trace([index, from_fd, from_buffer_list[index]]);
		const bytesRead = node_fs.readSync(from_fd, from_buffer_list[index]);
		bytesRead_array[index] = bytesRead;
	}

	let max_buffer_index = BUFFER_SIZE;
	for (let buffer_index = 0, start_index = 0; buffer_index < BUFFER_SIZE; buffer_index++) {
		while (start_index < bytesRead_array.length && bytesRead_array[start_index] <= buffer_index) {
			// 本 from_buffer_list[start_index] 已經讀取完畢的話，就跳到下一個。
			start_index++;
		}
		if (start_index === bytesRead_array.length) {
			// 所有的 buffer 都沒有尚未處理的資料了。
			// assert: 所有檔案串流都讀取完畢。
			// assert: 所有 from_buffer_list 皆處理完畢。
			// Should using bytesRead_array[start_index]
			max_buffer_index = buffer_index;
			not_ended = false;
			break;
		}

		const base_byte = from_buffer_list[start_index][buffer_index];
		let consistent = true;
		// 快速檢查。
		for (let index = start_index + 1; index < from_buffer_list.length; index++) {
			if (buffer_index >= bytesRead_array[index] || base_byte !== from_buffer_list[index][buffer_index]) {
				consistent = false;
				break;
			}
		}
		if (consistent) {
			continue;
		}

		different_byte_count++;

		// assert: 有些 from_buffer_list 尚未處理。

		// TOO SLOW!!!
		const count_hash = { [base_byte]: 1 };
		for (let index = start_index + 1; index < from_buffer_list.length; index++) {
			if (buffer_index >= bytesRead_array[index])
				continue;
			const byte = from_buffer_list[index][buffer_index];
			count_hash[byte] = (count_hash[byte] || 0) + 1;
		}
		//console.log(count_hash);

		if (false) {
			const sorted_bytes_list = Object.entries(count_hash).sort((pair_1, pair_2) => pair_2[1] - pair_1[1]);
			// assert: sorted_bytes_list.length >= 1, 次數自大至小排列
			if (sorted_bytes_list[0][1] === sorted_bytes_list[1][1])
				doubtful_byte_count++;
		}

		let max_count = 0, max_byte, muttiple_max_byte;
		for (const byte in count_hash) {
			if (max_count < count_hash[byte]) {
				max_count = count_hash[byte];
				max_byte = byte;
				muttiple_max_byte = false;
			} else {
				muttiple_max_byte = max_count === count_hash[byte];
			}
		}
		// assert: max_count > 0
		if (false && max_count === 0) {
			// assert: 所有 from_buffer_list 皆處理完畢。
			max_buffer_index = buffer_index - 1;
			not_ended = false;
			break;
		}
		if (muttiple_max_byte)
			doubtful_byte_count++;
		else {
			console.trace(process_to + buffer_index);
			console.log([max_count, max_byte, start_index, from_buffer_list, muttiple_max_byte, count_hash]);
		}
		from_buffer_list[0][buffer_index] = max_byte;
	}

	node_fs.writeSync(target_fd, from_buffer_list[0], 0, max_buffer_index);
	process_to += max_buffer_index;
	process.stdout.write(`${process_to / max_size * 100 | 0}% ${CeL.to_KiB(process_to)} / ${CeL.to_KiB(max_size)} ...\r`);
} while (not_ended);

node_fs.closeSync(target_fd);
from_fd_list.forEach(from_fd => node_fs.closeSync(from_fd));

CeL.info(`All ${different_byte_count} byte(s) different. ${doubtful_byte_count} byte(s) hard to decide.`);
