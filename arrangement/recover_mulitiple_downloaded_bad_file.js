/**
 * @fileoverview 當多次下載一個大檔案，卻各有不同錯誤時，可利用本工具回復原先完整的檔案。將以多數檔案的內容為準。最好下載三次以上，方便比對。
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

const BUFFER_INDEX_TO_WRITE = 0;

let different_byte_count = 0, doubtful_byte_count = 0;

const target_file_path = process.argv[2];
const target_fd = node_fs.openSync(target_file_path, 'w');

const from_fso_list = [], bad_block_list = [];
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

// ------------------------------------------------------------------------------------------------

// 以多數檔案的內容為準。
// TOO SLOW!!!
function most_frequently_byte(selector_configuration) {
	const { from_buffer_list, buffer_index, bytesRead_array, start_index, base_byte, block_index } = selector_configuration;

	const count_hash = { [base_byte]: 1 };
	for (let index = start_index + 1; index < from_buffer_list.length; index++) {
		if (buffer_index >= bytesRead_array[index])
			continue;
		const byte = from_buffer_list[index][buffer_index];
		count_hash[byte] = (count_hash[byte] || 0) + 1;
	}
	//console.log(count_hash);

	let max_count = 0, selected_byte, muttiple_max_byte;
	for (const byte in count_hash) {
		if (max_count < count_hash[byte]) {
			max_count = count_hash[byte];
			selected_byte = byte;
			muttiple_max_byte = false;
		} else {
			muttiple_max_byte = max_count === count_hash[byte];
		}
	}
	// assert: max_count > 0
	if (muttiple_max_byte)
		doubtful_byte_count++;

	return selected_byte;
}

const use_select_by_process_to = 0;
let latest_block_index;
function select_by_process_to(selector_configuration) {
	const { from_buffer_list, buffer_index, bytesRead_array, start_index, base_byte, block_index } = selector_configuration;

	let list_index = block_index < 3900 ? 1 : 0;
	//list_index = block_index < 800 ? 1 : 0;
	list_index = process_to / max_size > .95 ? 1 : 0;

	if (list_index === 0 && latest_block_index !== block_index) {
		latest_block_index = block_index;
		CeL.warn(`${select_by_process_to.name}: Different block: ${block_index} / ${max_size / BUFFER_SIZE + 1 | 0} (${block_index / (max_size / BUFFER_SIZE) * 100 | 0}%)`);
	}

	return from_buffer_list[list_index][buffer_index];
}

// ------------------------------------------------------------------------------------------------

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

	let max_buffer_index = BUFFER_SIZE, is_bad_block, block_index = process_to / BUFFER_SIZE;
	for (let buffer_index = 0, start_index = 0; buffer_index < BUFFER_SIZE; buffer_index++) {
		while (start_index < bytesRead_array.length && bytesRead_array[start_index] <= buffer_index) {
			// 本 from_buffer_list[start_index] 已經讀取完畢的話，就跳到下一個。
			start_index++;
		}
		if (start_index === bytesRead_array.length) {
			// assert: 所有檔案串流都讀取完畢。
			// assert: 所有 from_buffer_list 都沒有尚未處理的資料了。皆處理完畢。
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

		is_bad_block = true;
		different_byte_count++;

		// assert: 有些 from_buffer_list 尚未處理。

		const selector_configuration = { from_buffer_list, buffer_index, bytesRead_array, start_index, base_byte, block_index };

		const selected_byte = use_select_by_process_to
			? select_by_process_to(selector_configuration)
			: most_frequently_byte(selector_configuration);

		from_buffer_list[BUFFER_INDEX_TO_WRITE][buffer_index] = selected_byte;
	}

	if (is_bad_block)
		bad_block_list.push(block_index);
	node_fs.writeSync(target_fd, from_buffer_list[BUFFER_INDEX_TO_WRITE], 0, max_buffer_index);
	process_to += max_buffer_index;
	CeL.log_temporary(`${process_to / max_size * 100 | 0}% ${CeL.to_KiB(process_to)} / ${CeL.to_KiB(max_size)
		}${different_byte_count ? `, ${CeL.to_KiB(different_byte_count)} different` : ''}`);

} while (not_ended);

node_fs.closeSync(target_fd);
from_fd_list.forEach(from_fd => node_fs.closeSync(from_fd));

CeL.info(`All ${CeL.to_KiB(different_byte_count)} different.${doubtful_byte_count
	? ` ${CeL.to_KiB(doubtful_byte_count)} (${(doubtful_byte_count / different_byte_count * 100).to_fixed(1)}%) hard to decide.`
	: ''}`);
if (doubtful_byte_count > 0)
	CeL.log(`${bad_block_list.length} bad blocks: ${bad_block_list}`);
