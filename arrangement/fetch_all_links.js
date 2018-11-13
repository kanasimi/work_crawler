/**
 * @fileoverview 下載網頁中所有連結的工具，例如電子書。
 * 
 * @since 2018/11/12 18:7:47 初版
 */

'use strict';

global.need_work_id = false;

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------
// Load module.

// CeL.run();

// ----------------------------------------------------------------------------

CeL.get_URL.default_user_agent = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36"
		+ Math.random();

var fetch = CeL.fetch, node_url = require('url'),
//
base_URL = process.argv[2],
/** {String}下載完成檔案所放置的目錄。 e.g., "node fetch_all_links.js C target_directory" */
target_directory = process.argv[3];

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
		url = base_URL + url;
	}

	return url;
}

var url_list = [], downloaded_count = 0;

var worker = fetch(base_URL).then(function(response) {
	return response.text();
}).then(function(html) {
	var PATTERN = /<a [^<>]*href=["']([^"']+)["'][^<>]*>/g, matched;
	while (matched = PATTERN.exec(html)) {
		var url = full_URL_of_path(matched[1]);
		url_list.push(url);
	}
	CeL.info('Downloading ' + url_list.length + ' urls...');
	download_next();
});

function download_next() {
	var url;
	while (true) {
		if (url_list.length === 0) {
			CeL.info('All ' + downloaded_count + ' files downloaded.');
			return;
		}
		if (url = url_list.shift()) {

			var file_name = decodeURI(url).match(/[^\/]+$/);
			if (!file_name || !(file_name = file_name[0].match(/\?f=(.+)/))) {
				download_next();
				if (/\.(?:epub|mobi|azw\d?|fb2|djvu|pdf|docx|htmlz|chm|txt)/i
						.test(url))
					throw 'epub? ' + url;
				return;
			}
			file_name = file_name[1];

			// CeL.info('Downloading ' + url);
			CeL.get_URL_cache(url, function(data, error, XMLHttp) {
				// XMLHttp && console.log(XMLHttp.headers);
				if (data.toString().length < 1000) {
					if (data.toString().includes('文件未找到')) {
						download_next();
					} else {
						// XMLHttp.status === 200

						console.log(file_name + ': ' + data.toString());
						// 刪除有問題的檔案。
						CeL.remove_file(target_directory + file_name);
						setTimeout(download_next, 60 * 1000);
					}
				} else {
					downloaded_count++;
					download_next();
				}
			}, {
				directory : target_directory,
				file_name : file_name
			});
			return;
		}
	}
}
