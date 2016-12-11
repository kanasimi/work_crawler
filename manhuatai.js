/**
 * 批量下載漫画台的工具。 Download manhuatai comics.
 */

'use strict';

require('./comic loder.js');

// ----------------------------------------------------------------------------

var PATTERN_chapter_data = /<li><a title="([^"]+)" href="((\d{0,4})[^"]*)"><span>(.+?)<\/span><\/a><\/li>/g,
//
manhuatai = new CeL.comic.site({
	// allow .jpg without EOI mark.
	allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	skip_error : true,
	// recheck:從頭檢測所有作品之所有章節。
	// recheck : true,
	// one_by_one : true,
	base_URL : 'http://www.manhuatai.com/',

	// 取得伺服器列表。
	// http://server.taomanhua.com:82/mhpic.asp?callback=1&_=1478324001349
	// JSON.parse("{'o':[['mhpic.taomanhua.com','线路1',0],['58.218.199.16','线路2',0],['59.45.79.108','线路3',0]]}".replace(/'/g,'"')).o
	server_URL : 'http://server.taomanhua.com:82/mhpic.asp',
	parse_server_list : function(html) {
		return JSON.parse(
		//
		html.between('"', '"').replace(/'/g, '"'))
		//
		.map(function(server_data) {
			return server_data[0];
		});
	},

	// 解析 作品名稱 → 作品id get_work()
	// use_server_cache : true,
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
	work_URL : function(work_id) {
		return this.base_URL + work_id + '/';
	},
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
	get_chapter_count : function(work_data, html) {
		work_data.chapter_list = [];
		var matched,
		// [ , chapter_title, chapter_url, chapter_id, chapter_title_and_pages ]
		PATTERN_chapter = new RegExp(PATTERN_chapter_data);
		while (matched = PATTERN_chapter.exec(html)) {
			work_data.chapter_list.push({
				// 可能會有重複: 连载+番外+单行本
				// NO : +matched[3],
				url : matched[2],
				title : matched[4]
			});
		}
		work_data.chapter_count = work_data.chapter_list.length;
		if (work_data.chapter_count > 1) {
			// 轉成由舊至新之順序。
			work_data.chapter_list = work_data.chapter_list.reverse();
		}
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter) {
		return this.work_URL(work_data.id)
				+ work_data.chapter_list[chapter - 1].url;
	},
	parse_chapter_data : function(html, work_data) {
		// decode chapter data
		// modify from
		// http://www.manhuatai.com/static/comicread.js?20161105124102
		function decode(mh_info) {
			mh_info = mh_info
			// key:"property" → "key":"property"
			.replace(/([a-z]+):((?:\d{1,20}|"(?:[^\\"]+|\\.)*")[,}])/ig,
					'"$1":$2')
			// fix for JSON
			.replace(/\\'/g, "'");
			try {
				mh_info = JSON.parse(mh_info);
			} catch (e) {
				CeL.err(url + '\n' + JSON.stringify(mh_info));
				throw e;
			}
			mh_info.imgpath = mh_info.imgpath.replace(/./g, function(a) {
				return String.fromCharCode(a.charCodeAt(0) - mh_info.pageid
						% 10)
			});
			CeL.debug(mh_info.mhname + ' ' + mh_info.pagename + ': '
					+ decodeURIComponent(mh_info.imgpath));
			return mh_info;
		}

		var chapter_data = html.between(' mh_info=', ';</script>');
		if (!chapter_data || !(chapter_data = decode(chapter_data))) {
			return;
		}

		// 設定必要的屬性。
		chapter_data.title = chapter_data.pagename;
		// chapter_data.image_count = chapter_data.totalimg;
		chapter_data.image_list = new Array(chapter_data.totalimg).fill(null)
		//
		.map(function(i, index) {
			return {
				url : '/comic/' + chapter_data.imgpath
				//
				+ (index + 1 + chapter_data.startimg - 1) + '.jpg'
			}
		});

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

manhuatai.start(work_id);
