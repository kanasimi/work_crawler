/**
 * 批量下載 逻辑思维IO知识服务社 內容 的工具。 Download ljswio.
 * 
 * @see http://getbootstrap.com/
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// CeL.detect_HTML_language()
, 'application.locale' ]);

// ----------------------------------------------------------------------------

function add_chapter_list(work_data, html) {
	var list = html.between('<div class="article-list">', '</article>'), matched, PATTERN_item = /<div class="article-row">[\s\S]*?<a [^<>]*?href="([^<>"]+)"[^<>]*? title="([^<>"]+)"/g;

	while (matched = PATTERN_item.exec(list)) {
		work_data.chapter_list.push({
			url : matched[1],
			title : matched[2]
		});
	}
}

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。default:false
	// recheck='changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。否則只會自上次下載過的章節接續下載。
	recheck : 'changed',

	// one_by_one : true,
	base_URL : 'https://www.ljsw.io/',

	// 取得作品的章節資料。 get_work_data()
	work_URL : 'knowl/column/',
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			title : get_label(html.between('<h3 class="panel-title">', '</h3>')
					|| html.between('<title>', '</title>')),
			site_name : get_label(html.between('<div class="copyright',
					'</div>').between('>')),
			last_update : new Date().format('%Y/%2m/%2d')
		};
		extract_work_data(work_data, html);

		return work_data;
	},
	pre_get_chapter_list : function(callback, work_data, html, get_label) {
		work_data.chapter_list = [];

		var list = html.between('<ul class="pagination">', '</ul>');
		if (!list) {
			add_chapter_list(work_data, html);
			callback();
		}

		var _this = this, chapter_base_URL, last_list_NO,
		//
		matched, PATTERN_item =
		//
		/<a [\s\S]*?href\s*=\s*"([^<>"]+?\/column\/(\d+)\/)(\d+)"/g;

		while (matched = PATTERN_item.exec(list)) {
			if (matched[2] === work_data.id
					&& !(last_list_NO > (matched[3] |= 0))) {
				last_list_NO = matched[3];
				chapter_base_URL = matched[1];
			}
		}

		CeL.run_serial(function(run_next, item, index, list) {
			CeL.log_temporary(item + '/' + last_list_NO);

			CeL.get_URL(_this.base_URL + chapter_base_URL + item, function(
					XMLHttp) {
				add_chapter_list(work_data, XMLHttp.responseText);
				run_next();

			}, _this.charset, null, Object.assign({
				error_retry : _this.MAX_ERROR_RETRY
			}, _this.get_URL_options));

		}, last_list_NO, 1, callback);

	},
	get_chapter_list : function(work_data, html) {
		// 採用倒序。
		work_data.chapter_list.reverse();
		// console.log(work_data);
	},

	media_list : [],
	get_media_file : function(url, file_path) {
		var _this = this, media_data = this.media_list[0];
		CeL.log('get_media_file: ' + media_data.file + ' ('
				+ this.media_list.length + ' left)');
		CeL.get_URL_cache(media_data.url, function(data, error) {
			// CeL.info('get_media_file: OK: ' + media_data.file);
			_this.media_list.shift();
			if (_this.media_list.length > 0) {
				_this.get_media_file();
			}
		}, {
			file_name : media_data.file,
			encoding : undefined,
			get_URL_options : Object.assign({
				error_retry : _this.MAX_ERROR_RETRY
			}, this.get_URL_options, {
				// 有些檔案比較大，必須花費比較多時間。
				timeout : 60 * 1000
			})
		});
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		var directory = work_data.directory + 'media' + CeL.env.path_separator,
		//
		title = get_label(html.between('<h1 class="post-title">', '</h1>')),
		//
		count = 0, matched, PATTERN_media = /<audio [^<>]*?src="([^<>"]+)"/g;
		while (matched = PATTERN_media.exec(html)) {
			CeL.create_directory(directory);
			var url = matched[1], extension = url.match(/\.[^.]+$/)[0];
			this.media_list.push({
				file : directory + chapter_NO.pad(4) + ' '
						+ CeL.to_file_name(title)
						+ (++count > 1 ? '-' + count : '') + extension,
				url : url
			});
			if (this.media_list.length === 1) {
				this.getting = true;
				this.get_media_file();
			}
		}

		var text = html.between('<div class="panel-body">',
				'<div class="panel-footer">');
		if (true) {
			text = text
			// 僅取文章部分。
			.between('<div class="custom-richtext">', {
				tail : '</div>'
			});

		} else {
			text = text
			// 去掉標題
			.replace(/<h1 class="post-title">[\s\S]+?<\/h1>/, '')
			// 去掉音檔
			.replace(/<audio [^<>]+>[\s\S]*?<\/audio>/g, function(all) {
				return '<!-- ' + all.replace(/ src=/g, ' src_=') + ' -->';
			});
		}

		text = text.replace(
		// 設定好圖案網址
		/<img [^<>]*?src="data:img\/[^<>"]+" [^<>]*data-url="[^<>"]+"[^<>]*>/g,
				function(all) {
					return all.replace(/src="[^<>"]+"/, '').replace(
							/data-url=/, 'src=');
				});
		if (/src="data:/.test(text)) {
			console.log(text);
			throw 'Includes data URI scheme';
		}

		if (!work_data.author) {
			matched = html.between('<p class="post-byline">', '</p>');
			if (matched && (matched = matched.match(
			// PATTERN_author
			/<a href="[^<>"]+?\/people\/[^<>"]+?"[^<>]*? title="([^<>"]+)">/
			//
			))) {
				work_data.author = get_label(matched[1]);
			}
		}

		this.add_ebook_chapter(work_data, chapter_NO, {
			title : title,
			date : html.between('<p class="post-byline">', '<').trim().replace(
					/^\d*$/, ''),
			text : text
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
