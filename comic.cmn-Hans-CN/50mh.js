/**
 * 批量下載 漫画堆（原 50漫画网） 的工具。 Download manhuadui comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.SinMH');

// ----------------------------------------------------------------------------

// https://stackoverflow.com/questions/20082893/unable-to-verify-leaf-signature
// for Error: unable to verify the first certificate
// code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var crawler = CeL.SinMH({
	// one_by_one : true,
	skip_error : true,

	// 201/3/30: https://www.50mh.com/
	// 201/5/29 前更改域名與名稱→ 漫画堆 https://www.manhuadui.com/
	base_URL : 'https://www.manhuadui.com/',

	search_URL : 'API',
	api_base_URL : 'https://450.manhuadang.net/',
	id_of_search_result : 'slug',

	// @see function decrypt20180904() @
	// https://www.manhuadui.com/js/decrypt20180904.js
	crypto : {
		key : "123456781234567G",
		iv : 'ABCDEF1G34123412'
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
