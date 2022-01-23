/**
 * 批量下載 哔哩哔哩漫画 的工具。 Download bilibili comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 檔案數量多時會拖比較久，必須加長 timeout 時間。
	timeout : '40s',

	// e.g., 26945 恶女会改变\0025 023\26945-25-024.png
	acceptable_types : 'png',

	// one_by_one : true,
	base_URL : 'https://manga.bilibili.com/',
	API_BASE : 'twirp/comic.v1.Comic/',
	// 圖床主機
	BFS_URL : 'https://manga.hdslb.com',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		// https://github.com/kanasimi/work_crawler/issues/233
		return [ this.API_BASE + 'Search', {
			"page_num" : 1,
			"page_size" : 10,
			"key_word" : work_title
		}, {
			headers : {
				'Content-Type' : 'application/json;charset=UTF-8'
			}
		} ];
	},
	parse_search_result : function(html, get_label) {
		// console.log(html);
		html = JSON.parse(html).data.list;
		// console.log(html);

		return [ html, html ];
	},
	id_of_search_result : 'id',
	title_of_search_result : 'org_title',

	// 取得作品的章節資料。 get_work_data()
	// e.g., 'https://manga.bilibili.com/m/detail/mc25852'
	// work_URL : 'm/detail/mc',
	work_URL : function(work_id) {
		return [ this.API_BASE + 'ComicDetail?device=h5&platform=h5', {
			comic_id : work_id
		} ];
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// console.log(html);
		var work_data = JSON.parse(html).data, start_chapter_NO_next_time;
		// 正規化成 CeJS 網路作品爬蟲程式庫的格式。
		Object.assign(work_data, {
			author : work_data.author_name.join(' '),
			description : work_data.evaluate,
			tags : work_data.styles,
			image : work_data.vertical_cover,
			update_frequency : work_data.renewal_time,
			is_finished : work_data.is_finish,
			status : work_data.is_finish ? '完结' : '连载',
			// is_limit=1: 在中國以外區域觀看日本漫畫?
			// comic_type=1: 收費漫畫? 此章节为付费章节
			some_limited : work_data.is_limit || work_data.comic_type,

			chapter_list : work_data.ep_list.map(function(chapter_data) {
				return {
					id : chapter_data.id,
					title : chapter_data.short_title
					// e.g., https://manga.bilibili.com/detail/mc26723
					+ (chapter_data.title ? ' ' + chapter_data.title : ''),
					limited : chapter_data.is_locked || chapter_data.pay_mode,
					url : [ this.API_BASE
					// 2021/12/2–2021/12/17 之間? 哔哩哔哩漫画 改版
					+ 'GetImageIndex?device=pc&platform=web',
					//
					{
						ep_id : chapter_data.id
					}, {
						headers : {
							Accept : 'application/json, text/plain, */*',
							'Content-Type' : 'application/json;charset=UTF-8',
							Origin : this.base_URL.replace(/\/$/, ''),
							Referer : this.full_URL(
							//
							'm/mc' + work_data.id + '/' + chapter_data.id)
						}
					} ]
				};
			}, this).reverse(),
			chapter_count : work_data.total
		});
		if (start_chapter_NO_next_time)
			work_data.start_chapter_NO_next_time = start_chapter_NO_next_time;
		// console.log(work_data);
		return work_data;
	},

	// r.decode(); @ t.decodeIndexData @
	// https://s1.hdslb.com/bfs/static/manga/mobile/static/js/read.b8ba074e2011370f741a.js

	// using https://github.com/Stuk/jszip
	pre_parse_chapter_data
	// 執行在解析章節資料 process_chapter_data() 之前的作業 (async)。
	// 必須自行保證執行 callback()，不丟出異常、中斷。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		var data_URL, chapter_data = work_data.chapter_list[chapter_NO - 1];
		try {
			data_URL = JSON.parse(XMLHttp.responseText);
		} catch (e) {
		}
		if (!data_URL || !data_URL.data || !data_URL.data.path) {
			// e.g., node bilibili.js 26470
			// console.trace(data_URL);
			if (work_data.is_limit
			// && data_URL.code === 'invalid_argument'
			) {
				CeL.error(CeL.gettext('無法閱覽%1《 %2》，直接跳過本漫畫！',
				// 放棄下載
				work_data.japan_comic ? '日本漫畫' : '本漫畫', work_data.title));
				work_data.jump_to_chapter = work_data.chapter_list.length;
			}
			callback();
			return;
		}

		var _this = this, data_file_directory, data_file_path;

		data_URL = this.BFS_URL + data_URL.data.path;
		this.get_URL(data_URL, function(XMLHttp) {
			// console.log(XMLHttp);

			if (XMLHttp.statusText === 'Forbidden'
			// 2022/1/20 17:52:27 觀看此章節前需要先登錄
			&& XMLHttp.responseText.includes('<h1>403 Forbidden</h1>')) {
				chapter_data.limited = true;
				callback();
				return;
			}

			var indexData = XMLHttp.buffer;
			if (!indexData || (indexData = indexData
			// .slice(9): skip "BILICOMIC"...
			.slice(9)).length === 0) {
				// 2021/12 改版前 PC端只給看10話？或可由 pwork_data.age_allow 來檢查？
				// chapter_data.image_list = [];
				callback();
				return;
			}

			unhashContent(chapter_data.id, work_data.id, indexData);

			data_file_directory = work_data.directory + chapter_NO.pad(4)
					+ '.tmp' + CeL.env.path_separator;
			CeL.create_directory(data_file_directory);
			data_file_path = data_file_directory + chapter_NO.pad(4)
					+ '.data.zip';
			CeL.write_file(data_file_path, indexData);

			// using 7-Zip to extract data file
			var data_archive = new CeL.storage.archive(data_file_path);
			data_archive.extract({
				output : data_file_directory
			}, parse_data_file);
		});

		function parse_data_file(output, error) {
			if (error) {
				_this.onerror(error, work_data);
			}
			CeL.remove_file(data_file_path);
			var fso_list = CeL.read_directory(data_file_directory);
			// assert: fso_list === [ 'index.dat' ]
			// console.log(fso_list);
			Object.assign(chapter_data, CeL.get_JSON(data_file_directory
					+ fso_list[0]));
			// 清理戰場。
			CeL.remove_directory(data_file_directory, true);

			chapter_data.image_list = chapter_data.pics;

			var get_URL_options = chapter_data.url[2];
			_this.get_URL_options.headers.Referer
			// @see parse_work_data() above
			= get_URL_options.headers.Referer;
			_this.get_URL(_this.API_BASE + 'ImageToken?device=pc&platform=web',
			//
			function(XMLHttp) {
				// console.log(XMLHttp);
				var response = XMLHttp.responseText;
				try {
					response = JSON.parse(response);
				} catch (e) {
					// TODO: handle exception
				}
				if (!response || !response.data) {
					CeL.error('下載出錯！假如反覆出現此錯誤，並且確認圖片沒問題，煩請回報。取得資料：'
							+ XMLHttp.responseText);
					callback();
					return;
				}
				// console.log(response.data);
				chapter_data.image_list = response.data
				// 2019/7/4–2019/8/7 之間? 哔哩哔哩漫画 改版
				.map(function(image_data) {
					var url = image_data.url;
					if (!url.includes('://'))
						url = _this.BFS_URL + url;
					return url + '?token=' + image_data.token;
				});
				// console.log(chapter_data);
				callback();

			}, {
				urls : JSON.stringify(chapter_data.image_list)
			}, get_URL_options);
		}
	}

});

// ----------------------------------------------------------------------------

// return t.prototype._generateHashKey = function() @
// https://s1.hdslb.com/bfs/static/manga/mobile/static/js/read.b8ba074e2011370f741a.js
function generateHashKey(t, e) {
	var n = new Uint8Array(new ArrayBuffer(8));
	n[0] = t;
	n[1] = t >> 8;
	n[2] = t >> 16;
	n[3] = t >> 24;
	n[4] = e;
	n[5] = e >> 8;
	n[6] = e >> 16;
	n[7] = e >> 24;
	return n;
}

// t.prototype._unhashContent = function() @
// https://s1.hdslb.com/bfs/static/manga/mobile/static/js/read.b8ba074e2011370f741a.js
function unhashContent(episodeId, seasonId, indexData) {
	var hashKey = generateHashKey(episodeId, seasonId);
	for (var t = 0, e = indexData.length; t < e; t++)
		indexData[t] ^= hashKey[t % 8];
}

// ----------------------------------------------------------------------------

// CeL.set_debug(3);
start_crawler(crawler, typeof module === 'object' && module);
