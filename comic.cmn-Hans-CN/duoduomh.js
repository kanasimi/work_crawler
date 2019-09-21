/**
 * 批量下載 欢乐漫画网/多多漫画 的工具。 Download hlgoo/duoduomh comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.SinMH');

// ----------------------------------------------------------------------------

var crawler = CeL.SinMH({
	base_URL : 'https://www.hlgoo.cn/',

	skip_error : true,

	search_URL : 'API',
	id_of_search_result : 'slug'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
