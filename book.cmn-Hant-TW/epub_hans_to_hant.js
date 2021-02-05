/**
 * 將 epub 簡體中文電子書轉換為繁體中文的工具。
 * 
 * @since 2018/8/7<br />
 *        2018/8/20 18:10:52 use (new CeL.EPUB(epub_directory)).archive()
 * 
 * @see CeL.application.net.work_crawler.ebook
 *      https://github.com/ThanatosDi/EpubConv_Python
 */

require('../_CeL.loader.nodejs.js');

CeL.run([ 'application.storage.archive', 'application.storage.EPUB',
// Add color to console messages. 添加主控端報告的顏色。
'interact.console',
// CeL.write_file()
'application.platform.nodejs', 'application.storage',
// CeL.CN_to_TW('简体')
'extension.zh_conversion' ], initialization);

function initialization() {
	return Promise.resolve(CeL.using_CeCC({
		try_LTP_server : true
	})).then(handle_files);
}

function handle_files() {
	var epub_file_path = process.argv[2];
	if (!epub_file_path) {
		var main_script = require.main
				&& require.main.filename.match(/[^\\\/]+$/)[0];
		CeL.log('Convert epub: hans to hant. 將 epub 簡體中文電子書轉換為繁體中文的工具。\n\n'
				+ 'Usage:\n	node ' + main_script + ' "path/to/epub.epub"');
		return;
	}

	if (!CeL.storage.file_exists(epub_file_path)) {
		CeL.error('No such file: ' + epub_file_path);
		return;
	}

	archive_file = new CeL.storage.archive(epub_file_path);

	// CeL.set_debug();
	var epub_directory = epub_file_path.replace(/\.[^.]+$/, '').trim();
	CeL.debug('Remove directory: ' + epub_directory);
	CeL.remove_directory(epub_directory, true);

	CeL.debug('Extract epub files: ' + epub_file_path);
	archive_file.ebook_file_list = [];

	var convert_options = {
		// only for debug CeCC 繁簡轉換。
		cache_directory : CeL.append_path_separator(
		//
		epub_directory.replace(/[\/]*$/, ' - 繁簡轉換 cache')),
		// 超過此長度才 cache。
		min_cache_length : 20
	};
	process.stdout.write('Extracting ebook ' + epub_file_path + ' ...\r');
	archive_file.extract({
		output : epub_directory
	}, convert_files);

	function convert_files(output) {
		// console.log(String(output));
		// console.log(CeL.traverse_file_system + '');
		return Promise.resolve().then(
				CeL.traverse_file_system.bind(null, epub_directory,
						for_text_file.bind(archive_file)))
		//
		.then(pack_up_files.bind(null, output));
	}

	function pack_up_files(output) {
		archive_file.ebook_file_list = archive_file.ebook_file_list
		// assert: path.startsWith(epub_directory+CeL.env.path_separator)
		.map(function(path) {
			return path.slice(epub_directory.length + 1);
		});
		// console.log(archive_file.ebook_file_list);

		var converted_epub_file = epub_file_path.replace(/(\.[^.]+)$/, ' ('
				+ CeL.gettext.to_standard('cmn-Hant-TW') + ')$1');
		CeL.remove_file(converted_epub_file);

		process.stdout.write('Packing epub file: ' + converted_epub_file
				+ ' ...\r');
		// 打包 epub。結果會存放到與 epub_file_path 相同的目錄。
		(new CeL.EPUB(epub_directory)).archive(converted_epub_file, true,
				archive_file.ebook_file_list);

		// TODO: if error occurred, do not remove directory.
		CeL.debug('Remove directory: ' + epub_directory);
		CeL.remove_directory(epub_directory, true);
		CeL.info('Convert epub: 繁簡轉換完畢: ' + converted_epub_file);
	}

	function for_text_file(path, fso_status, is_directory, options) {
		// 記錄原先已有的檔案。
		if (path !== 'mimetype')
			this.ebook_file_list.push(path);

		if (!/\.(?:[sx]?html?|xml|te?xt|ncx|opf)$/i.test(path))
			return;

		process.stdout.write('Convert to hant ' + options.file_count + ': '
				+ path + ' ...\r');
		// CeL.info('for_text_file: Convert to hant: ' + path);
		var contents = CeL.get_file(path);
		return Promise.resolve().then(
				CeL.CN_to_TW.bind(null, contents, convert_options))
		//
		.then(function(contents) {
			contents = contents
			// TODO: 把半形標點符號轉換為全形標點符號
			.replace(/["'](?:zh-(?:cmn-)?|cmn-)?(?:Hans-)?CN["']/ig,
			// "zh-TW"
			'"zh-cmn-Hant-TW"');
			if (false) {
				CeL.info('for_text_file: Converted to hant: ' + path + ', '
				//
				+ contents.slice(0, 40) + '...');
			}
			CeL.write_file(path, contents);
		});
	}
}
