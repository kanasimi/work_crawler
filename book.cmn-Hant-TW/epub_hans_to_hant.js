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

var gettext;
function initialization() {
	gettext = CeL.gettext;
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

	var convert_to_language = 'TW';

	archive_file = new CeL.storage.archive(epub_file_path);

	// CeL.set_debug();
	var epub_directory = epub_file_path.replace(/\.[^.]+$/, '').trim();
	CeL.debug({
		T : [ '移除目錄：%1', epub_directory ]
	});
	CeL.remove_directory(epub_directory, true);

	CeL.debug({
		T : [ 'Extract ebook as cache: [%1]', epub_file_path ]
	});
	archive_file.ebook_file_list = [];

	var work_title = epub_directory.match(/[^\\\/]+$/)[0].replace(/\.[^.]+$/,
			'');
	// Calibre2 轉存時，會存成 "work title - author.epub"
	var matched = work_title.match(/^(.+?) - (.+)$/);
	if (matched)
		work_title = matched[1];
	// console.trace([work_title,matched]);

	// --------------------------------

	var file_count = 0;

	var convert_options = {
		// only for debug CeCC 繁簡轉換。
		cache_directory : CeL.append_path_separator(
		// "main file name - 繁簡轉換 cache/"
		epub_directory.replace(/[\/]*$/, ' - 繁簡轉換 cache')),
		cache_file_for_short_sentences : true,
		// 超過此長度才 cache。
		min_cache_length : 20
	};

	return new Promise(function(resolve, reject) {
		CeL.log_temporary(gettext('Extract ebook as cache: [%1]',
				epub_file_path));
		archive_file.extract({
			output : epub_directory
		}, function(output) {

			var cecc = CeL.CN_to_TW && CeL.CN_to_TW.cecc;
			// console.trace(cecc);
			// console.trace(cecc.load_text_to_check);
			// console.trace(epub_directory);
			if (cecc && cecc.load_text_to_check) {
				var promise_load_text_to_check = cecc.load_text_to_check({
					work_title : work_title,
					convert_to_language : convert_to_language
				}, {
					reset : true
				});
				if (CeL.is_thenable(promise_load_text_to_check)) {
					// console.trace(promise_load_text_to_check);
					return promise_load_text_to_check.then(convert_files.bind(
							null, output));
				}
			}

			convert_files(output).then(resolve);
		});
	});

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
				+ gettext.to_standard('cmn-Hant-TW') + ')$1');
		CeL.remove_file(converted_epub_file);

		CeL.log_temporary(gettext('開始建構電子書……', converted_epub_file));
		// 打包 epub。結果會存放到與 epub_file_path 相同的目錄。
		(new CeL.EPUB(epub_directory)).archive(converted_epub_file, true,
				archive_file.ebook_file_list);

		// TODO: if error occurred, do not remove directory.
		CeL.debug({
			T : [ '移除目錄：%1', epub_directory ]
		});
		CeL.remove_directory(epub_directory, true);
		CeL.info('Convert epub: 繁簡轉換完畢: ' + converted_epub_file);

		var cecc = CeL.CN_to_TW && CeL.CN_to_TW.cecc;
		if (cecc && cecc.report_text_to_check) {
			cecc.report_text_to_check({
				convert_to_language : convert_to_language
			});
		}
	}

	function for_text_file(path, fso_status, is_directory, options) {
		// 記錄原先已有的檔案。
		if (path !== 'mimetype')
			this.ebook_file_list.push(path);

		if (!/\.(?:[sx]?html?|xml|te?xt|ncx|opf)$/i.test(path))
			return;

		++file_count;
		process.title = file_count + '/' + options.all_file_count + ' → hant';
		CeL.log_temporary('Convert to hant ' + file_count + '/'
				+ options.all_file_count + '+ ' + path);
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
