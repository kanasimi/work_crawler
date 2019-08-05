/**
 * 批量下載 动漫屋网/漫画人 的工具。 Download dm5.com comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.dm5');

// ----------------------------------------------------------------------------

// https://stackoverflow.com/questions/31673587/error-unable-to-verify-the-first-certificate-in-nodejs
// fix Error: unable to verify the first certificate
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

var crawler = CeL.dm5({
	one_by_one : true,
	base_URL : 'https://www.dm5.com/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
