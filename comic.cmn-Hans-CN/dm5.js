/**
 * 批量下載 动漫屋网/漫画人 的工具。 Download dm5.com comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.dm5');

// ----------------------------------------------------------------------------

// https://stackoverflow.com/questions/31673587/error-unable-to-verify-the-first-certificate-in-nodejs
// fix Error: unable to verify the first certificate
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

var crawler = CeL.dm5({
	one_by_one : true,
	// 2019/9: https://www.dm5.com/
	// 2019/10: 可以使用 http://cnc.dm5.com/
	// 2020/2: http://www.dm5.com/
	base_URL : 'http://www.dm5.com/',
	extract_work_id : function(work_information) {
		// /^manhua-[a-z\-\d]+$/;
		// e.g., http://www.dm5.com/manhua-1122/
		// http://www.dm5.com/manhua--c-94-okazu/
		return /^manhua-[a-z\-\d]+$/.test(work_information)
		//
		&& work_information;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
