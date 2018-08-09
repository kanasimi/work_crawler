/**
 * 批量下載遠流出版公司台灣雲端書庫的工具。 Download lib.ebookservice.tw books.
 * 
 * <code>

// Using chrome, doing the work below, 在完全載入完之前就執行:

// ======================================================================================
// step: save pages

// for PDF

// document.title = '[] ';

var html = [], page = 1, page_to = $('li').length * 2,
//
token = 'bookId,token,bookToken'.split(',').map(function(name) {
	var PATTERN = new RegExp(/\sname\s*:\s*'([^'\n]+)'/

	.source.replace('name', name));
	return name + '=' + document.body.innerHTML.match(PATTERN)[1];
}).join('&');

for (; page <= page_to; page++) {
	html.push('<img src="http://voler.ebookservice.tw/book/img?p=' + page
			+ '&f=jpg&r=150&preferWidth=1079&preferHeight=1920&' + token
			+ '" />');
}

$("body").empty().css({
	overflow : 'auto'
}).append(html.join('<br />'));

// go to step: converting pages

// ---------------------------------------------------------------------------------
// for epub

// After loading, break at XHR, move to new chapter, move to views.js:
// http://voler.ebookservice.tw/public/scripts/bookvoler-3.0/views.js
window.book = book;
// Run...

// --------------------------

var cejs_node = document.createElement("script");
cejs_node.setAttribute('src', 'https://kanasimi.github.io/CeJS/ce.js');
cejs_node.setAttribute('type', 'text/javascript');
document.head.appendChild(cejs_node);


// --------------------------

CeL.run('data.native');

document.title = '[' + book.metadata.creator + '] ' + book.metadata.bookTitle;

var html = [
		'<textarea>' + escape(JSON.stringify_circular(book)) + '</textarea>',
		'<object id="container.xml" data="' + book.settings.bookPath
				+ 'META-INF/container.xml"><\/object>',
		'<object id="content.opf" data="' + book.settings.contentsPath
				+ 'content.opf"><\/object>' ], token;
Object.keys(book.manifest).forEach(function(id) {
	var data = book.manifest[id], node,
	//
	href = book.settings.contentsPath + data.href;
	if (data.type.startsWith('image/')) {
		node = '<img id="' + id + '" src="' + href + '" />';
	} else if (data.type === 'text/css') {
		node = '<link id="' + id
		//
		+ '" rel="stylesheet" type="text/css" href="' + href + '" />';
	} else if (data.type === 'application/xhtml+xml') {
		node = '<iframe id="' + id + '" src="' + href + '"><\/iframe>';
	} else {
		node = '<object id="' + id + '" data="' + href + '"><\/object>';
	}
	html.push(node);
});

$("body").empty().append(html.join('<br />'));


// ======================================================================================
// step: converting pages

// Waiting for the page loaded (check network), and save the page "Save as...",
// and then run this tool. (e.g., `node ebookservice.js S:\b\台灣雲端書庫.html`)


</code>
 * 
 * @since 2017/11/18 10:3:6
 */

// node ebookservice.js S:\b\台灣雲端書庫.html
'use strict';

require('../_CeL.loader.nodejs.js');

CeL.run([ 'application.storage.archive',
// Add color to console messages. 添加主控端報告的顏色。
'interact.console',
// CeL.HTML_to_Unicode()
'interact.DOM',
// CeL.write_file()
'application.platform.nodejs', 'application.storage' ]);

var target_html_file = process.argv[2];

if (!target_html_file) {
	var main_script = process.mainModule.filename.match(/[^\\\/]+$/)[0];
	CeL.log('批量下載遠流出版公司台灣雲端書庫的工具。\n\n' + 'Usage:\n	node ' + main_script
			+ ' "saved webpage.html"');
	process.exit();
}

var source_directory = target_html_file.replace(/[^\\\/]+$/, ''), html = CeL
		.read_file(target_html_file).toString(), matched, target_directory;

if (html.includes('<iframe id="')) {
	// for epub

	// https://github.com/futurepress/epub.js
	target_directory = target_html_file.replace(/\.[^.]*$/, '') + '.epub'
			+ CeL.env.path_separator;
	CeL.create_directory(target_directory);

	var book = JSON.parse_circular(unescape(html.between('<textarea>',
			'</textarea>')));
	if (typeof book.manifest !== 'object')
		book.manifest = book.ready.manifest.promise._result;
	html = html.between('</textarea>');

	// console.log(book.ready);
	// console.log(target_directory + 'mimetype');
	CeL.write_file(target_directory + 'mimetype', 'application/epub+zip',
			'ascii');
	var content_directory = target_directory
			+ book.settings.contentsPath.between(book.settings.bookPath);
	// console.log(content_directory);
	CeL.create_directory(content_directory);

	// media_src_of_file[src of xhtml] = relative path get from book data
	var media_src_of_file = CeL.null_Object();
	Object.keys(book.manifest).forEach(function(key) {
		var data = book.manifest[key];
		// console.log(key);
		// console.log(data);
		var matched = decodeURI(data.href).match(/[^\\\/]+$/);
		if (matched)
			media_src_of_file[matched[0]] = decodeURI(data.href);
	});
	// console.log(book.setting);
	// console.log(media_src_of_file);

	function write_xml(source, target, xhtml_href) {
		var code = CeL.read_file(source).toString();
		if (xhtml_href) {
			var prefix = xhtml_href.replace(/[^\/]+$/, '').replace(/^\.\//, '')
					.replace(/[^\/]+\//g, '../');
			code = code.replace(/<!-- saved from url=[\s\S]+?-->[\r\n]*/, '')
			// 調整媒體與圖片的路徑。
			.replace(/\s(src|href)="([^<>"]+)"/g, function(all, tag, src) {
				// console.log(src);
				src = src.replace(book.settings.contentsPath, '')
				//
				.replace(/^\.\//, '');
				if (/^https?:\/\//.test(src)) {
					// e.g., http://a.b.c/
					return all;
				}
				src = src.match(/[^\/]+$/)[0];
				var anchor = src.match(/^([^#]*)(#.*)$/);
				if (anchor) {
					src = anchor[1];
					anchor = anchor[2];
				} else {
					anchor = '';
				}
				if (media_src_of_file[src]) {
					return ' ' + tag + '="' + prefix
					// 這裡的路徑media_src_of_file[src]是相對於電子書內容的目錄。因此若電子書的xhtml文件檔放在子目錄下面的話，那就得要另外再做調整。
					+ media_src_of_file[src] + anchor + '"';
				}
				CeL.warn('write_xml: No relative path found: '
				//
				+ src + ', ' + all);
				return all;
			});
		} else {
			code = CeL.HTML_to_Unicode(code.between('<pre', {
				tail : '</pre>'
			}).between('>'));
		}
		CeL.write_file(target, code.trim());
	}

	var PATTERN_file = /<(?:iframe|img|link|object) id="([^<>"]+)"([^<>]+)>/g;
	// 先登記一次，以確保檔案都能夠在media_src_of_file[]裡面找到。
	while (matched = PATTERN_file.exec(html)) {
		var src = matched[2].match(/ (?:src|href|data)="([^<>"]+)"/)[1]
				.replace(/^\.\//, '');

		var data = book.manifest[matched[1]];
		if (!data) {
			// e.g., 'container.xml', 'content.opf'
			continue;
		}
		var matched = src.match(/[^\/]+$/);
		if (matched) {
			media_src_of_file[matched[0]] = decodeURI(data.href);
		}
		data.file_path = src;
		// console.log(data);
	}

	while (matched = PATTERN_file.exec(html)) {
		var src = matched[2].match(/ (?:src|href|data)="([^<>"]+)"/)[1]
				.replace(/^\.\//, '');
		if (matched[1] === 'container.xml') {
			CeL.create_directory(target_directory + 'META-INF'
					+ CeL.env.path_separator);
			write_xml(source_directory + src, target_directory + 'META-INF'
					+ CeL.env.path_separator + 'container.xml');
			continue;
		}
		if (matched[1] === 'content.opf') {
			write_xml(source_directory + src, content_directory + matched[1]);
			continue;
		}

		var data = book.manifest[matched[1]];

		var target_file = content_directory + decodeURI(data.href), _content_directory = target_file
				.replace(/[^\\\/]+$/, '');
		if (content_directory !== _content_directory)
			CeL.create_directory(_content_directory);
		if (target_file.endsWith('.ncx')) {
			write_xml(source_directory + src, target_file);
		} else if (data.type.startsWith('image/')) {
			CeL.copy_file(source_directory + src, target_file);
		} else {
			write_xml(source_directory + src, target_file, decodeURI(data.href));
		}
	}

} else {
	// for PDF
	target_directory = target_html_file.replace(/\.[^.]*$/, '') + '.images'
			+ CeL.env.path_separator;
	CeL.create_directory(target_directory);

	var images = [], PATTERN_image = /<img src="([^<>"]+)"/g, image_NO = 1, start_empty_NO;
	while (matched = PATTERN_image.exec(html)) {
		var source_file = source_directory
				+ CeL.HTML_to_Unicode(matched[1].replace(/^\.\//, '')),
		//
		size = CeL.fso_status(source_file);
		// console.log([ source_file, size ]);
		if (size)
			size = size.size;
		if (start_empty_NO > 0) {
			if (size > 0)
				throw '從第' + start_empty_NO + '號圖片開始沒有內容，但是從第' + image_NO
						+ '號圖片開始又有內容';
		} else if (size > 0) {
			CeL.copy_file(source_file, target_directory + (image_NO++).pad(3)
					+ '.jpg')
		} else {
			start_empty_NO = image_NO;
		}
	}

	CeL.info(target_directory + ': '
			+ (start_empty_NO > 0 ? start_empty_NO - 1 : image_NO)
			+ ' images get.');
}
