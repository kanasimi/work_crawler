/**
 * 將 epub 簡體中文電子書轉換為繁體中文的工具。
 * 
 * @since 2018/8/7<br />
 *        2018/8/20 18:10:52 use (new CeL.EPUB(epub_directory)).archive()
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
	var epub_file_path = process.argv[2];
	if (!epub_file_path) {
		var main_script = process.mainModule && process.mainModule.filename.match(/[^\\\/]+$/)[0];
		CeL.log('Convert epub: hans to hant. 將 epub 簡體中文電子書轉換為繁體中文的工具。\n\n'
				+ 'Usage:\n	node ' + main_script + ' "epub.epub"');
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
	archive_file.extract({
		output : epub_directory
	}, function convert_files(output) {
		// console.log(String(output));
		// console.log(CeL.traverse_file_system + '');
		CeL.traverse_file_system(epub_directory, for_text_file
				.bind(archive_file));
		archive_file.ebook_file_list = archive_file.ebook_file_list
		// assert: path.startsWith(epub_directory+CeL.env.path_separator)
		.map(function(path) {
			return path.slice(epub_directory.length + 1);
		});
		// console.log(archive_file.ebook_file_list);

		var converted_epub_file = epub_file_path.replace(/(\.[^.]+)$/,
				' (cmn-Hant-TW)$1');
		CeL.remove_file(converted_epub_file);

		CeL.debug('Pack epub file: ' + converted_epub_file);
		// 打包 epub。結果會存放到與 epub_file_path 相同的目錄。
		(new CeL.EPUB(epub_directory)).archive(converted_epub_file, true,
				archive_file.ebook_file_list);

		CeL.debug('Remove directory: ' + epub_directory);
		CeL.remove_directory(epub_directory, true);
	});
}

function for_text_file(path, fso_status, is_directory) {
	// 記錄原先已有的檔案。
	if (path !== 'mimetype')
		this.ebook_file_list.push(path);

	if (!/\.(?:[sx]?html?|xml|te?xt|ncx|opf)$/i.test(path))
		return;

	CeL.log('Convert to hant: ' + path);
	var contents = CeL.get_file(path);
	contents = CeL.CN_to_TW(contents)
	// TODO: 把半形標點符號轉換為全形標點符號
	.replace(/["'](?:zh-(?:cmn-)?|cmn-)?(?:Hans-)?CN["']/ig, 'zh-cmn-Hant-TW');
	CeL.write_file(path, contents);
};
