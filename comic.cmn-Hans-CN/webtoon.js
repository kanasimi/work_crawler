/**
 * 批量下載 WEBTOON 中文官網 韓國漫畫 的工具。 Download NAVER WEBTOON comics.
 * (comic.cmn-Hant-TW)
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.webtoon');

// ----------------------------------------------------------------------------

var crawler = CeL.webtoon({
	// https://www.webtoons.com/zh-hant/

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return 'https://ac.webtoons.com/ac?q=zh-hant%11'
		//
		+ encodeURIComponent(work_title)
		//
		+ '&q_enc=UTF-8&st=1&r_lt=0&r_format=json&r_enc=UTF-8&_callback=jQuery'
		//
		+ String(Math.floor(Math.random() * 1e10))
				+ String(Math.floor(Math.random() * 1e10)) + '_' + Date.now()
				+ '&_=' + Date.now();
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
