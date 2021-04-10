/**
 * @fileoverview 下載網頁中所有連結檔案，例如下載網頁中電子書的工具。
 * 
 * @since 2018/11/12 18:7:47 初版
 */

'use strict';

global.need_work_id = false;

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------
// Load module.

// CeL.run();

// CeL.character.load('big5');
// CeL.character.load('gb2312');

CeL.get_URL.default_user_agent = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36"
		+ Math.random();

// ----------------------------------------------------------------------------

var fetch = CeL.fetch, node_url = require('url'),
// web_page_URL
base_URL = process.argv[2],
/** {String}下載完成檔案所放置的目錄。 e.g., "node fetch_all_links.js C target_directory" */
target_directory = process.argv[3],
// e.g., azw3
PATTERN_ebook_link = /\.(epub|mobi|azw\d?|fb2|txt|pdf|DjVu|docx?|xps|chm|htmlz|cbz|cbr)(?:$|[?#])/i;

if (!base_URL || !target_directory) {
	var main_script = require.main
			&& require.main.filename.match(/[^\\\/]+$/)[0];
	CeL.log('Download links in web page. 下載網頁中所有連結檔案，例如下載網頁中電子書的工具。\n\n'
			+ 'Usage:\n	node ' + main_script + ' "URL" "target directory"');
	process.exit();
}

target_directory = CeL.append_path_separator(target_directory);

// modify from CeL.application.net.Ajax
// 本函式將使用之 encodeURIComponent()，包含對 charset 之處理。
// @see function_placeholder() @ module.js
var encode_URI_component = function(string, encoding) {
	if (CeL.character) {
		CeL.debug('採用 ' + CeL.Class
		// 有則用之。 use CeL.data.character.encode_URI_component()
		+ '.character.encode_URI_component', 1, CeL.Class
		// module name
		+ '.application.net.work_crawler');
		encode_URI_component = CeL.character.encode_URI_component;
		return encode_URI_component(string, encoding);
	}
	return encodeURIComponent(string);
};

// @see function full_URL_of_path() @ CeL.application.net.work_crawler
function full_URL_of_path(url) {
	// combine urls
	if (typeof url === 'string' && !url.includes('://')) {
		if (url.startsWith('/')) {
			if (url.startsWith('//')) {
				// 借用 base_URL 之 protocol。
				return base_URL.match(/^(https?:)\/\//)[1] + url;
			}
			// url = url.replace(/^[\\\/]+/g, '');
			// 只留存 base_URL 之網域名稱。
			return base_URL.match(/^https?:\/\/[^\/]+/)[0] + url;
		} else {
			// 去掉開頭的 "./"
			url = url.replace(/^\.\//, '');
		}
		if (url.startsWith('.')) {
			CeL.warn('full_URL_of_path: Invalid url: ' + url);
		}
		url = base_URL.replace(/[^\/]+$/, '') + url;
	}

	return url;
}

var url_list = [], downloaded_count = 0;

CeL.get_URL_cache(base_URL, function(html, error, XMLHttp) {
	// console.log(XMLHttp || error);
	html = html.toString();
	var PATTERN = /<a [^<>]*href=["']([^"']+)["'][^<>]*>/ig, matched;
	while (matched = PATTERN.exec(html)) {
		var url = full_URL_of_path(matched[1]);
		url_list.push(url);
	}
	CeL.info('Downloading ' + url_list.length + ' urls...');
	download_next();
}, {
	directory : target_directory,
	// reget : true,
	get_URL_options : {
		redirect : true,
		ondatastart : function(response) {
			if (false)
				response.pipe(require('fs').createWriteStream(
						target_directory + 'data.html.zip'));
		}
	}

});

function download_next() {
	while (true) {
		if (url_list.length === 0) {
			CeL.info('All ' + downloaded_count + ' files downloaded.');
			return;
		}

		var url = url_list.shift();
		if (!url)
			continue;

		// unescape(): for %23
		var file_name = unescape(decodeURI(url)).match(/[^\/]+$/);
		// console.log('Test ' + file_name);

		// filter
		if ((file_name in {})
		// || file_name.includes('')
		// || /^.{1,2}\.html?$/i.test(file_name)
		) {
			continue;
		}

		// 檢查檔案是否存在
		if (CeL.file_exists(target_directory + file_name)) {
			continue;
		}

		// CeL.info('Downloading ' + url);
		CeL.get_URL_cache(url, function(data, error, XMLHttp) {
			// XMLHttp && console.log(XMLHttp.headers);
			data = data && data.toString() || '';
			if (data.length < 1000
					&& (!/\.txt$/i.test(file_name) || data.includes('文件未找到')
							|| data.includes('每小时限制下载') || data
							.includes('每分钟最大下载'))) {
				console.log(file_name + ': ' + (data || 'no response'));
				// 刪除有問題的檔案。
				CeL.remove_file(target_directory + file_name);

				if (data.includes('文件未找到')) {
					download_next();
				} else {
					// XMLHttp.status === 200
					var time_interval = 60 * 1000;
					setTimeout(download_next, time_interval);
					CeL.log_temporary('Wait ' + CeL.age_of(0, time_interval)
							+ ' to get next file');
				}
			} else {
				downloaded_count++;
				download_next();
			}
		}, {
			directory : target_directory,
			file_name : file_name,
			get_URL_options : {
				timeout : 3 * 60 * 1000
			}
		});
		return;
	}
}
