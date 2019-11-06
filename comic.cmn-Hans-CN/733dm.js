/**
 * 批量下載733动漫网的工具。 Download 733dm comics.
 * 
 * @see qTcms 晴天漫画程序 晴天漫画系统 http://manhua3.qingtiancms.com/
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.qTcms2017');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2017({
	// 本站常常無法取得圖片，因此得多重新檢查。
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。
	// recheck : true,
	// 當無法取得chapter資料時，直接嘗試下一章節。在手動+監視下recheck時可併用此項。
	// skip_chapter_data_error : true,

	// allow .jpg without EOI mark.
	// allow_EOI_error : true,
	// 當圖像檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。
	skip_error : true,

	// 當網站不允許太過頻繁的訪問/access時，可以設定下載之前的等待時間(ms)。
	// chapter_time_interval : '2s',

	// 2018/3: https://www.733dm.net/
	base_URL : 'https://www.733.so/',

	// 733动漫网 2018/11/9 之後 (11/16之後?) 改版成 晴天漫画系统
	// fs.readdirSync('.').forEach(function(d){if(/^\d+\s/.test(d))fs.renameSync(d,'manhua-'+d);})
	// fs.readdirSync('.').forEach(function(d){if(/^manhua-/.test(d))fs.renameSync(d,d.replace(/^manhua-/,''));})
	// 所有作品都使用這種作品類別前綴。
	common_catalog : 'mh',

	// 取得作品的章節資料。 get_work_data()
	parse_chapter_data_201811 : function(html, work_data) {
		var chapter_data = html.between('qTcms_S_m_murl_e="', '"');
		if (chapter_data) {
			// 對於非utf-8編碼之中文，不能使用 atob()???
			chapter_data = atob(chapter_data).split("$qingtiandy$");
		}
		if (!chapter_data) {
			CeL.log('無法解析資料！');
			return;
		}
		// console.log(JSON.stringify(chapter_data));
		// console.log(chapter_data.length);
		// CeL.set_debug(6);

		// 設定必要的屬性。
		chapter_data = {
			image_list : chapter_data.map(function(url) {
				url = encodeURI(url);

				// f_qTcms_Pic_curUrl() → f_qTcms_Pic_curUrl_realpic(v) @
				// https://www.733.so/template/skin2/css/d7s/js/show.20170501.js?20190105114149
				var timestamp = Date.now();
				var File_Server = "http://img_733.234us.com/newfile.php?data=";

				url = url.replace("http://www.baidu1.com/", "");
				// using File_Server 图片服务器: 此 URL 會再轉址至圖片真實網址。
				url = File_Server + btoa(url + "|" + timestamp + "|"
				// 733dm.js: 2019/2/16 改版
				+ html.between('qTcms_S_m_id="', '"') + "|"
				//
				+ html.between('qTcms_S_p_id="', '"') + "|pc");

				return {
					url : url
				};
			}, this)
		};
		// console.log(JSON.stringify(chapter_data));

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
