/**
 * 批量下載漫画台的工具。 Download manhuatai comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

var server_list_hash = CeL.null_Object(),
// [ , chapter_title, chapter_url, chapter_id, chapter_title_and_pages ]
PATTERN_chapter_data = /<li><a title="([^"]+)" href="((\d{0,4})[^"]*)"><span>(.+?)<\/span><\/a><\/li>/g,
//
crawler = new CeL.work_crawler({
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,

	// allow .jpg without EOI mark.
	allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	skip_error : true,

	// one_by_one : true,
	base_URL : 'http://www.manhuatai.com/',

	// 提取出引數（如 URL）中的作品ID 以回傳。
	extract_work_id : function(work_information) {
		return /^[a-z\d]+$/.test(work_information) && work_information;
	},

	// 取得伺服器列表。
	// http://server.taomanhua.com:82/mhpic.asp?callback=1&_=1478324001349
	// JSON.parse("{'o':[['mhpic.taomanhua.com','线路1',0],['58.218.199.16','线路2',0],['59.45.79.108','线路3',0]]}".replace(/'/g,'"')).o
	// 2016/12/25 9:40:33 漫画台 server list file format changed
	// {"status":0,"msg":"ok","data":[{"domain":"mhpic.taomanhua.com","name":"线路1","status":"0"},{"domain":"59.45.79.93","name":"线路2","status":"0"},{"domain":"58.218.199.16","name":"线路3","status":"0"},{"domain":"59.45.79.108","name":"线路4","status":"0"}]}
	// server_URL : 'http://server.taomanhua.com:82/mhpic.asp',
	parse_server_list : function(html) {
		return JSON.parse(html).data
		// modify from n.getPicUrl @
		// http://www.manhuatai.com/static/comicread.js?20170401181816
		.map(function(server_data) {
			var server = server_data.domain;
			return server.includes('mhpic') ? server : server + ':82';
		});
	},
	// use cache of host list. 不每一次重新取得伺服器列表。
	// use_server_cache : true,

	// 解析 作品名稱 → 作品id get_work()
	search_URL : 'getjson.shtml?q=',
	parse_search_result : function(html) {
		// e.g.,
		// [{"cartoon_id":"doupocangqiong","cartoon_name":"斗破苍穹","cartoon_status_id":"连载","latest_cartoon_topic_name":"第177话
		// 刀光剑影"},{"cartoon_id":"dpcqdfw","cartoon_name":"斗破苍穹大番外药老传奇","cartoon_status_id":"连载","latest_cartoon_topic_name":"第11话
		// 酒鬼高手"},{"cartoon_id":"dpcqylcq","cartoon_name":"斗破苍穹之药老传奇","cartoon_status_id":"连载","latest_cartoon_topic_name":"19话药尘的回忆下"}]
		var id_data = html ? JSON.parse(html) : [];
		return [ id_data, id_data ];
	},
	id_of_search_result : 'cartoon_id',
	title_of_search_result : 'cartoon_name',

	// 取得作品的章節資料。 get_work_data()
	parse_work_data : function(html, get_label) {
		// work_data={id,title,author,authors,chapters,last_update,last_download:{date,chapter}}
		return {
			// 必要屬性：須配合網站平台更改。
			title : html.between('"og:novel:book_name" content="', '"'),

			// 選擇性屬性：須配合網站平台更改。
			status : html.between('"og:novel:status" content="', '"'),
			author : html.between('"og:novel:author" content="', '"'),
			url : html.between('"og:url" content="', '"'),
			description : html.between(' class="wz clearfix t1"><div>',
			//
			'<a href="javascript:void(0);" target="_self" class="wzrtitle"'),
			last_update : html.between(
			//
			'"og:novel:update_time" content="', '"')
		};
	},
	get_chapter_list : function(work_data, html) {
		work_data.chapter_list = [];
		var matched;
		while (matched = PATTERN_chapter_data.exec(html)) {
			work_data.chapter_list.push({
				// 可能會有重複: 连载+番外+单行本
				// NO : +matched[3],
				url : matched[2],
				title : matched[4]
			});
		}
		if (work_data.chapter_list.length > 1) {
			// 轉成由舊至新之順序。
			work_data.inverted_order = true;
		} else {
			// e.g., http://www.manhuatai.com/faqishaonv/99.html
			// http://www.kanman.com/27965/99.html
			work_data.trying = true;
			CeL.info('嘗試用數字遍歷的方法一個一個測試是否能讀取。檢查到第300章都還沒有內容就放棄。');
			for (var i = 1; i < 300; i++) {
				work_data.chapter_list.push({
					url : '/' + work_data.id + '/' + i + '.html'
				});
			}
		}
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		if (work_data.trying) {
			var matched = html.match(/<a( [^<>]+)>下一章<\/a>/);
			if (matched && (matched = matched[1].match(/ href="([^<>"]+)"/))) {
				work_data.chapter_list.truncate(chapter_NO);
				if (/html?$/i.test(matched[1])) {
					// CeL.info('parse_chapter_data: next: ' + matched[1]);
					work_data.chapter_list.push({
						url : matched[1]
					});
				}
				work_data.chapter_count = work_data.chapter_list.length;
			}
		}

		// decode chapter data
		// modify from n.getPicUrl @
		// http://www.manhuatai.com/static/comicread.js?20170401181816
		function decode(mh_info) {
			// console.log(mh_info);
			// http://www.manhuatai.com/static/comicread.js?20170809232416
			mh_info = mh_info.replace(/;_czc\s*=/, ';var _czc=').replace(
					/isMobile/g, 'false');
			eval('mh_info=' + mh_info);
			mh_info.imgpath = mh_info.imgpath.replace(/./g, function(a) {
				return String.fromCharCode(a.charCodeAt(0) - mh_info.pageid
						% 10)
			});
			CeL.debug(mh_info.mhname + ' ' + mh_info.pagename + ': '
					+ decodeURIComponent(mh_info.imgpath), 1, 'decode');
			return mh_info;
		}

		var chapter_data = html.between(' mh_info=', '</script>');
		if (!chapter_data || !(chapter_data = decode(chapter_data))) {
			return;
		}

		// 設定必要的屬性。
		chapter_data.title = chapter_data.pagename;
		chapter_data.postfix = '.jpg'
		// http://static.321mh.com/js/comic.read.min.js?20180731163120
		+ (/-\d+x\d+/gi.test(chapter_data.imgpath) ? ''
		// @see __cr.switchWebp=function
		: chapter_data.comic_size || '-noresize');

		// chapter_data.image_count = chapter_data.totalimg;
		chapter_data.image_list = new Array(chapter_data.totalimg).fill(null)
		// modify from n.getPicUrl @
		// http://www.manhuatai.com/static/comicread.js?20170401181816
		.map(function(i, index) {
			return {
				url : '/comic/' + chapter_data.imgpath
				//
				+ (index + chapter_data.startimg) + chapter_data.postfix
			}
		});

		return chapter_data;
	},

	pre_get_images : function(XMLHttp, work_data, chapter_data, callback) {
		var html = XMLHttp.responseText;
		if (!html) {
			callback();
		}
		var _this = this, use_domain = html.between('var mh_info=',
				'<\/script>').between('domain:"', '"'),
		//
		server_URL = server_list_hash[use_domain]
		// modify from n.init @
		// http://www.manhuatai.com/static/comicread.js?20170401181816
		|| 'http://server.' + use_domain + ':82/mhpic.asp';
		this.set_server_list(server_URL, function() {
			// cache server list
			server_list_hash[use_domain] = _this.server_list;
			callback();
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
