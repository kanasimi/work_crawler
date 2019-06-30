/**
 * 批量下載 漫画堆（原 50漫画网） 的工具。 Download manhuadui comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.SinMH');

// ----------------------------------------------------------------------------

// https://stackoverflow.com/questions/20082893/unable-to-verify-leaf-signature
// for Error: unable to verify the first certificate
// code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var crawler = CeL.SinMH({
	// one_by_one : true,

	// 201/3/30: https://www.50mh.com/
	// 201/5/29 前: https://www.manhuadui.com/
	base_URL : 'https://www.manhuadui.com/',

	search_URL : 'API',
	api_base_URL : 'https://450.manhuadang.net/',
	id_of_search_result : 'slug'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
